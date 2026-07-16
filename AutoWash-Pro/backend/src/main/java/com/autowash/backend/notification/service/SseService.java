package com.autowash.backend.notification.service;

import com.autowash.backend.notification.dto.NotificationResponseDTO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
public class SseService {

    private final Map<Integer, SseEmitter> emitters = new ConcurrentHashMap<>();

    public SseEmitter register(Integer userId) {
        SseEmitter emitter = new SseEmitter(Long.MAX_VALUE);

        emitters.put(userId, emitter);
        log.info("User {} kết nối SSE. Tổng online: {}", userId, emitters.size());

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

    public void pushToUser(Integer userId, NotificationResponseDTO dto) {
        SseEmitter emitter = emitters.get(userId);

        if (emitter == null) {
            log.debug("User {} offline, bỏ qua SSE push.", userId);
            return;
        }

        try {
            emitter.send(SseEmitter.event()
                    .name("notification")
                    .data(dto));
            log.info("Đã push SSE đến user {}: {}", userId, dto.getTitle());
        } catch (IOException e) {
            emitters.remove(userId);
            log.warn("Push SSE thất bại cho user {}: {}", userId, e.getMessage());
        }
    }

    public void pushRevoke(Integer userId, Integer notificationId) {
        SseEmitter emitter = emitters.get(userId);

        if (emitter == null) {
            log.debug("User {} offline, bỏ qua SSE push thu hồi.", userId);
            return;
        }

        try {
            emitter.send(SseEmitter.event()
                    .name("notification-revoked")
                    .data(Map.of("notificationId", notificationId)));
            log.info("Đã push SSE thu hồi đến user {}: notification {}", userId, notificationId);
        } catch (IOException e) {
            emitters.remove(userId);
            log.warn("Push SSE thu hồi thất bại cho user {}: {}", userId, e.getMessage());
        }
    }
}