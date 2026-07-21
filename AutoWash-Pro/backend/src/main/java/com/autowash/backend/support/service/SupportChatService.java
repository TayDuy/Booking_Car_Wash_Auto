package com.autowash.backend.support.service;

import com.autowash.backend.support.dto.SupportChatRequestDTO;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.json.JsonMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;

/**
 * Service gọi Google Gemini API để xử lý chat hỗ trợ khách hàng.
 *
 * Luồng hoạt động:
 *   Frontend (SupportChatWidget) → SupportChatController → SupportChatService → Gemini API
 *
 * Tại sao dùng Gemini thay vì Claude?
 *   Gemini có free tier thật sự (không cần thẻ tín dụng), phù hợp cho đồ án/dự án nhỏ.
 *   Giới hạn free tier: ~15 request/phút, ~1500 request/ngày cho model Flash.
 *
 * Cấu hình bắt buộc:
 *   Đặt biến môi trường GEMINI_API_KEY trước khi chạy backend.
 *   Tạo key miễn phí tại: https://aistudio.google.com/apikey
 *   KHÔNG hard-code key trực tiếp vào code hoặc commit lên git.
 */
@Service
public class SupportChatService {

    private static final Logger logger = LoggerFactory.getLogger(SupportChatService.class);

    // Model Gemini đang sử dụng — Flash là model nhanh, nhẹ, phù hợp chat realtime
    private static final String MODEL = "gemini-2.5-flash";

    // URL endpoint của Gemini API để sinh nội dung (generateContent)
    private static final String GEMINI_API_URL =
            "https://generativelanguage.googleapis.com/v1beta/models/" + MODEL + ":generateContent";

    // Giới hạn số token trong câu trả lời của AI (1 token ≈ 4 ký tự tiếng Anh)
    // 1024 token ≈ ~800 từ — đủ cho câu trả lời hỗ trợ, tránh phản hồi quá dài
    private static final int MAX_OUTPUT_TOKENS = 1024;

    /**
     * System prompt — định nghĩa vai trò và quy tắc hành xử của AI.
     * Gemini đọc đoạn này trước mỗi cuộc hội thoại để hiểu mình là ai
     * và nên trả lời như thế nào.
     */
    private static final String SYSTEM_PROMPT = """
            Bạn là trợ lý hỗ trợ khách hàng của WashFlow Pro — một ứng dụng đặt lịch rửa xe.
            Nhiệm vụ của bạn là giúp khách hàng với các câu hỏi về: đặt lịch rửa xe, các gói
            dịch vụ, thanh toán, chính sách hủy đơn, chương trình khách hàng thân thiết
            (tích điểm thưởng), và cách sử dụng ứng dụng.

            Quy tắc trả lời:
            - Luôn trả lời bằng tiếng Việt, ngắn gọn, thân thiện, đi thẳng vào vấn đề.
            - Nếu câu hỏi không liên quan đến WashFlow Pro hoặc dịch vụ rửa xe, hãy nhẹ nhàng
              hướng khách hàng quay lại các vấn đề mình có thể hỗ trợ.
            - Nếu không chắc câu trả lời hoặc câu hỏi cần tra cứu thông tin tài khoản cụ thể,
              hãy đề nghị khách hàng liên hệ hotline hoặc email support@washflowpro.vn để được
              hỗ trợ trực tiếp, thay vì đoán bừa.
            - Không bao giờ yêu cầu khách hàng cung cấp mật khẩu, mã OTP, hay thông tin thẻ
              thanh toán đầy đủ qua khung chat này.
            """;

    private final String apiKey;
    private final HttpClient httpClient;

    // ObjectMapper dùng để serialize request body sang JSON và parse response từ Gemini
    private final ObjectMapper objectMapper = new JsonMapper();

    /**
     * Constructor — Spring tự inject GEMINI_API_KEY từ biến môi trường vào đây.
     *
     * @Value("${gemini.api-key:}") nghĩa là:
     *   - Đọc property "gemini.api-key" trong application.properties
     *   - application.properties lấy giá trị từ biến môi trường GEMINI_API_KEY
     *   - Nếu không tìm thấy → mặc định là chuỗi rỗng "" (không throw lỗi ngay)
     *   - Lỗi sẽ được xử lý trong method ask() khi có request thật
     */
    public SupportChatService(@Value("${gemini.api-key:}") String apiKey) {
        this.apiKey = apiKey;

        // ── LOG DEBUG: kiểm tra key có được load không khi backend khởi động ──
        // Xóa 2 dòng logger này sau khi xác nhận key hoạt động bình thường
        if (apiKey == null || apiKey.isBlank()) {
            logger.error(">>> [DEBUG] GEMINI_API_KEY CHƯA LOAD — kiểm tra lại file .env và restart backend!");
        } else {
            logger.info(">>> [DEBUG] GEMINI_API_KEY đã load OK — {} ký tự, bắt đầu bằng: {}",
                    apiKey.length(), apiKey.substring(0, Math.min(8, apiKey.length())));
        }

        // HttpClient dùng lại (reuse) cho mọi request — hiệu quả hơn tạo mới mỗi lần
        // connectTimeout: thời gian tối đa để thiết lập kết nối TCP tới Gemini server
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    /**
     * Gửi câu hỏi của khách hàng kèm lịch sử hội thoại tới Gemini, trả về câu trả lời.
     *
     * @param request chứa: message (câu hỏi hiện tại) + history (lịch sử chat trong phiên)
     * @return nội dung câu trả lời dạng text thuần từ Gemini
     * @throws IllegalStateException nếu GEMINI_API_KEY chưa được cấu hình → HTTP 503
     * @throws RuntimeException      nếu gọi API thất bại hoặc response bất thường → HTTP 502
     */
    public String ask(SupportChatRequestDTO request) {

        // Kiểm tra key trước khi gọi API — nếu thiếu thì báo lỗi rõ ràng
        // Controller sẽ bắt IllegalStateException này và trả về HTTP 503
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException(
                    "Chưa cấu hình GEMINI_API_KEY ở phía backend. " +
                            "Vui lòng tạo API key miễn phí tại aistudio.google.com/apikey rồi đặt " +
                            "biến môi trường GEMINI_API_KEY trước khi dùng tính năng chat AI.");
        }

        try {
            // ── Bước 1: Xây dựng request body JSON gửi cho Gemini ─────────────────

            ObjectNode body = objectMapper.createObjectNode();

            // Thêm system prompt — Gemini dùng field "system_instruction" riêng biệt,
            // khác với Claude dùng field "system" trong messages
            ObjectNode systemInstruction = body.putObject("system_instruction");
            ArrayNode systemParts = systemInstruction.putArray("parts");
            systemParts.addObject().put("text", SYSTEM_PROMPT);

            // Mảng "contents" chứa toàn bộ lịch sử hội thoại + câu hỏi mới
            ArrayNode contents = body.putArray("contents");

            // ── Bước 2: Thêm lịch sử hội thoại (nếu có) ──────────────────────────
            // Gửi kèm lịch sử để AI có ngữ cảnh, tránh trả lời lạc đề ở lần sau.
            // Lưu ý: Gemini dùng role "user" / "model", KHÔNG phải "assistant" như Claude
            // → phải map lại role trước khi gửi
            List<SupportChatRequestDTO.ChatTurnDTO> history = request.getHistory();
            if (history != null) {
                for (SupportChatRequestDTO.ChatTurnDTO turn : history) {
                    // Bỏ qua những turn bị thiếu dữ liệu để tránh lỗi phía Gemini
                    if (turn.getRole() == null || turn.getContent() == null) continue;

                    // Map role: "assistant" (frontend gửi lên) → "model" (Gemini yêu cầu)
                    String geminiRole = "user".equals(turn.getRole()) ? "user" : "model";

                    ObjectNode turnNode = contents.addObject();
                    turnNode.put("role", geminiRole);
                    ArrayNode parts = turnNode.putArray("parts");
                    parts.addObject().put("text", turn.getContent());
                }
            }

            // ── Bước 3: Thêm câu hỏi mới nhất của khách hàng ─────────────────────
            ObjectNode userTurn = contents.addObject();
            userTurn.put("role", "user");
            ArrayNode userParts = userTurn.putArray("parts");
            userParts.addObject().put("text", request.getMessage());

            // ── Bước 4: Cấu hình giới hạn output ─────────────────────────────────
            ObjectNode generationConfig = body.putObject("generationConfig");
            generationConfig.put("maxOutputTokens", MAX_OUTPUT_TOKENS);

            // ── Bước 5: Gửi HTTP POST tới Gemini API ──────────────────────────────
            // API key truyền qua header "x-goog-api-key" (cách Gemini yêu cầu xác thực)
            // timeout 30s: thời gian tối đa chờ Gemini trả về response
            HttpRequest httpRequest = HttpRequest.newBuilder()
                    .uri(URI.create(GEMINI_API_URL))
                    .timeout(Duration.ofSeconds(30))
                    .header("Content-Type", "application/json")
                    .header("x-goog-api-key", apiKey)
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(body)))
                    .build();

            HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());

            // ── Bước 6: Kiểm tra HTTP status ──────────────────────────────────────
            // 200 = thành công; các mã khác (400 key sai, 429 rate limit, 500 Gemini lỗi...)
            if (response.statusCode() != 200) {
                logger.error(">>> [DEBUG] Gemini trả lỗi HTTP {}: {}", response.statusCode(), response.body());
                throw new RuntimeException(
                        "Gemini API trả về lỗi (HTTP " + response.statusCode() + "): " + response.body());
            }

            // ── Bước 7: Parse response và trích xuất text trả lời ─────────────────
            // Cấu trúc response Gemini:
            // {
            //   "candidates": [{
            //     "content": {
            //       "parts": [{ "text": "Nội dung câu trả lời..." }]
            //     }
            //   }]
            // }
            JsonNode root = objectMapper.readTree(response.body());

            JsonNode candidates = root.path("candidates");
            if (!candidates.isArray() || candidates.isEmpty()) {
                throw new RuntimeException("Gemini API không trả về candidate nào.");
            }

            // Ghép tất cả các part text lại thành một chuỗi hoàn chỉnh
            // (thường chỉ có 1 part, nhưng vẫn loop để an toàn)
            JsonNode parts = candidates.get(0).path("content").path("parts");
            StringBuilder result = new StringBuilder();
            for (JsonNode part : parts) {
                if (part.has("text")) {
                    result.append(part.path("text").asText());
                }
            }

            if (result.isEmpty()) {
                throw new RuntimeException("Gemini API không trả về nội dung văn bản.");
            }

            return result.toString();

        } catch (RuntimeException e) {
            // RuntimeException đã có message rõ ràng → ném thẳng lên controller
            throw e;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Lỗi khi gọi Gemini API: " + e.getMessage(), e);
        } catch (Exception e) {
            // Các lỗi khác (IOException khi gọi HTTP...) → wrap lại
            throw new RuntimeException("Lỗi khi gọi Gemini API: " + e.getMessage(), e);
        }
    }
}