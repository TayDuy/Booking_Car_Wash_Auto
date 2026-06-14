package com.autowash.backend.notification.service;

import com.autowash.backend.notification.dto.NotificationResponseDTO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Quản lý kết nối SSE (Server-Sent Events) cho real-time notification.
 *
 * <p>Tách riêng khỏi Controller và Service để tránh circular dependency:
 * NotificationServiceImpl → SseService ← NotificationController</p>
 *
 * <p>ConcurrentHashMap đảm bảo thread-safe khi nhiều user kết nối đồng thời.</p>
 */
@Slf4j
@Service
public class SseService {

    /**
     * Map lưu kết nối SSE của từng user đang online.
     * Key = userId, Value = SseEmitter (kết nối đang mở).
     */
    private final Map<Integer, SseEmitter> emitters = new ConcurrentHashMap<>();

    /**
     * Đăng ký kết nối SSE mới cho user.
     * Gọi khi user mở app và subscribe endpoint /stream.
     *
     * @param userId ID user cần đăng ký
     * @return SseEmitter — giữ kết nối mở để server đẩy event
     */
    public SseEmitter register(Integer userId) {
        // Timeout = Long.MAX_VALUE → giữ kết nối mãi, không tự đóng
        SseEmitter emitter = new SseEmitter(Long.MAX_VALUE);

        emitters.put(userId, emitter);
        log.info("User {} kết nối SSE. Tổng online: {}", userId, emitters.size());

        // Dọn dẹp khi client ngắt kết nối hoặc lỗi
        emitter.onCompletion(() -> {
            emitters.remove(userId);
            log.info("User {} ngắt kết nối SSE.", userId);
        });
        emitter.onTimeout(() -> {
            emitters.remove(userId);
            log.info("User {} SSE timeout.", userId);
        });
        emitter.onError(e -> {
            emitters.remove(userId);
            log.warn("User {} SSE lỗi: {}", userId, e.getMessage());
        });

        return emitter;
    }

    /**
     * Đẩy notification real-time đến user nếu đang online.
     * Nếu user offline (không có emitter) → bỏ qua,
     * user sẽ tự load từ DB khi mở app.
     *
     * @param userId ID user cần nhận notification
     * @param dto    notification vừa tạo
     */
    public void pushToUser(Integer userId, NotificationResponseDTO dto) {
        SseEmitter emitter = emitters.get(userId);

        // User không online → không làm gì, DB đã lưu rồi
        if (emitter == null) {
            log.debug("User {} offline, bỏ qua SSE push.", userId);
            return;
        }

        try {
            emitter.send(SseEmitter.event()
                    .name("notification")   // client lắng nghe event tên "notification"
                    .data(dto));            // data tự động serialize thành JSON
            log.info("Đã push SSE đến user {}: {}", userId, dto.getTitle());
        } catch (IOException e) {
            // Kết nối đã đóng nhưng chưa được dọn dẹp → remove thủ công
            emitters.remove(userId);
            log.warn("Push SSE thất bại cho user {}: {}", userId, e.getMessage());
        }
    }
}