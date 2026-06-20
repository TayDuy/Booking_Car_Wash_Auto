package com.autowash.backend.notification.service.impl;

import com.autowash.backend.notification.dto.*;
import com.autowash.backend.notification.entity.Notification;
import com.autowash.backend.notification.repository.NotificationRepository;
import com.autowash.backend.notification.service.NotificationService;
import com.autowash.backend.notification.service.SseService;
import com.autowash.backend.user.entity.User;
import com.autowash.backend.user.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Implementation của {@link NotificationService} (FR-12).
 *
 * <p>Toàn bộ class {@code readOnly = true} —
 * chỉ method write mới override thành {@code @Transactional}.</p>
 *
 * <p>Sau khi lưu DB, gọi {@link SseService#pushToUser} để đẩy
 * real-time đến user nếu đang online.</p>
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final SseService sseService; // ← inject để push real-time

    // ── CREATE ────────────────────────────────────────────────────────────────

    /**
     * {@inheritDoc}
     *
     * <p>Flow: resolve userId → build Notification → lưu DB
     * → push SSE real-time nếu user online.</p>
     */
    @Override
    @Transactional
    public NotificationResponseDTO create(NotificationCreateDTO dto) {
        User user = findUserOrThrow(dto.getUserId());

        Notification notification = Notification.builder()
                .user(user)
                .type(dto.getType())
                .title(dto.getTitle())
                .body(dto.getBody())
                .referenceId(dto.getReferenceId())
                .referenceType(dto.getReferenceType())
                .channel(dto.getChannel())
                .build();

        // 1. Lưu vào DB trước — đảm bảo không mất dù user offline
        NotificationResponseDTO response = toResponse(notificationRepository.save(notification));

        // 2. Push real-time qua SSE — nếu user offline thì bỏ qua
        sseService.pushToUser(dto.getUserId(), response);

        return response;
    }

    /**
     * {@inheritDoc}
     *
     * <p>Batch insert bằng saveAll() — tránh N+1 queries.
     * Sau đó push SSE đến từng user đang online.</p>
     */
    @Override
    @Transactional
    public BulkNotificationResponseDTO createBulk(BulkNotificationRequestDTO dto) {
        List<User> targets;
        if (dto.getUserIds() == null || dto.getUserIds().isEmpty()) {
            // Không chỉ định → broadcast tất cả user active
            targets = userRepository.findByStatus("active");
        } else {
            targets = userRepository.findAllById(dto.getUserIds());
        }

        List<Notification> notifications = targets.stream()
                .map(user -> Notification.builder()
                        .user(user)
                        .type(dto.getType())
                        .title(dto.getTitle())
                        .body(dto.getBody())
                        .channel(dto.getChannel())
                        .build())
                .toList();

        // Batch insert — 1 query thay vì N queries
        List<Notification> saved = notificationRepository.saveAll(notifications);

        // Push SSE đến từng user đang online sau khi lưu DB xong
        saved.forEach(n ->
                sseService.pushToUser(n.getUser().getId(), toResponse(n)));

        return BulkNotificationResponseDTO.builder()
                .totalSent(saved.size())
                .title(dto.getTitle())
                .build();
    }

    // ── READ ──────────────────────────────────────────────────────────────────

    /** {@inheritDoc} */
    @Override
    public List<NotificationResponseDTO> getByUser(Integer userId) {
        return notificationRepository
                .findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    /** {@inheritDoc} */
    @Override
    public List<NotificationResponseDTO> getUnreadByUser(Integer userId) {
        return notificationRepository
                .findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    /** {@inheritDoc} */
    @Override
    public UnreadCountResponseDTO countUnread(Integer userId) {
        long count = notificationRepository.countByUserIdAndIsReadFalse(userId);
        return new UnreadCountResponseDTO(userId, count);
    }

    // ── ACTION ────────────────────────────────────────────────────────────────

    /** {@inheritDoc} */
    @Override
    @Transactional
    public void markAsRead(Integer notificationId, Integer userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Notification không tồn tại: " + notificationId));

        // Bảo vệ ownership: chỉ đúng chủ mới được đánh dấu
        if (!notification.getUser().getId().equals(userId)) {
            throw new SecurityException("Không có quyền truy cập notification này.");
        }

        notification.markAsRead();
        notificationRepository.save(notification);
    }

    /** {@inheritDoc} */
    @Override
    @Transactional
    public void markAllAsRead(Integer userId) {
        List<Notification> unread = notificationRepository
                .findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId);

        unread.forEach(Notification::markAsRead);
        notificationRepository.saveAll(unread);
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    /**
     * Tìm User theo ID, ném exception nếu không tồn tại.
     */
    private User findUserOrThrow(Integer userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "User không tồn tại: " + userId));
    }

    /**
     * Map Notification entity → ResponseDTO.
     */
    private NotificationResponseDTO toResponse(Notification n) {
        return NotificationResponseDTO.builder()
                .notificationId(n.getNotificationId())
                .userId(n.getUser().getId())
                .username(n.getUser().getUsername())
                .type(n.getType())
                .title(n.getTitle())
                .body(n.getBody())
                .referenceId(n.getReferenceId())
                .referenceType(n.getReferenceType())
                .isRead(n.getIsRead())
                .channel(n.getChannel())
                .status(n.getStatus())
                .retryCount(n.getRetryCount())
                .createdAt(n.getCreatedAt())
                .updatedAt(n.getUpdatedAt())
                .build();
    }
}