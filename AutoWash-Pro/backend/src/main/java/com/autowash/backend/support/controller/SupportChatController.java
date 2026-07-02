package com.autowash.backend.support.controller;

import com.autowash.backend.common.dto.ApiResponse;
import com.autowash.backend.support.dto.SupportChatRequestDTO;
import com.autowash.backend.support.dto.SupportChatResponseDTO;
import com.autowash.backend.support.service.SupportChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST Controller cho khung chat trợ giúp AI ở trang /support.
 *
 * <p>Base path: {@code /api/v1/support}</p>
 *
 * <p>Khách hàng đăng nhập gửi câu hỏi → backend gọi Gemini API (free tier) →
 * trả lời lại. API key của Gemini chỉ nằm ở backend, không bao giờ lộ ra
 * frontend.</p>
 */
@RestController
@RequestMapping("/api/v1/support")
@RequiredArgsConstructor
public class SupportChatController {

    private final SupportChatService supportChatService;

    /**
     * Gửi câu hỏi của khách hàng cho Claude và nhận câu trả lời.
     *
     * <p>{@code POST /api/v1/support/chat}</p>
     *
     * @param dto câu hỏi hiện tại + lịch sử hội thoại trong phiên chat (nếu có)
     */
    @PostMapping("/chat")
    public ResponseEntity<ApiResponse<SupportChatResponseDTO>> chat(
            @Valid @RequestBody SupportChatRequestDTO dto) {
        try {
            String reply = supportChatService.ask(dto);
            return ResponseEntity.ok(
                    ApiResponse.success("Trả lời thành công", new SupportChatResponseDTO(reply)));
        } catch (IllegalStateException e) {
            // Chưa cấu hình API key ở backend
            return ResponseEntity
                    .status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(ApiResponse.error(503, e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity
                    .status(HttpStatus.BAD_GATEWAY)
                    .body(ApiResponse.error(502, "Không thể lấy câu trả lời từ trợ lý AI. Vui lòng thử lại sau."));
        }
    }
}