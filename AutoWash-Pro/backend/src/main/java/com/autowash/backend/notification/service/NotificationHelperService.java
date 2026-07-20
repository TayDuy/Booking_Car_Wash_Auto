package com.autowash.backend.notification.service;

import com.autowash.backend.notification.dto.NotificationResponseDTO;
import com.autowash.backend.notification.entity.Notification;
import com.autowash.backend.notification.repository.NotificationRepository;
import com.autowash.backend.user.entity.User;
import com.autowash.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationHelperService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final SseService sseService;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void sendNotificationSafely(Integer userId, Notification.NotificationType type, String title, String body, Integer refId, String refType) {
        if (userId == null) return;
        try {
            User user = userRepository.findById(userId).orElse(null);
            if (user == null) return;

            // Safe truncation to prevent DB constraint violations
            String safeTitle = title;
            if (safeTitle != null && safeTitle.length() > 100) {
                safeTitle = safeTitle.substring(0, 97) + "...";
            }
            String safeBody = body;
            if (safeBody != null && safeBody.length() > 500) {
                safeBody = safeBody.substring(0, 497) + "...";
            }
            String safeRefType = refType;
            if (safeRefType != null && !safeRefType.equalsIgnoreCase("booking") && !safeRefType.equalsIgnoreCase("payment")) {
                safeRefType = "booking";
            }

            Notification.NotificationType safeType = type;
            if (safeType == Notification.NotificationType.RATING_ALERT ||
                safeType == Notification.NotificationType.REFUND_REQUESTED ||
                safeType == Notification.NotificationType.REFUND_PROCESSING ||
                safeType == Notification.NotificationType.REFUND_APPROVED ||
                safeType == Notification.NotificationType.REFUND_REJECTED ||
                safeType == Notification.NotificationType.REFUND_COMPLETED) {
                safeType = Notification.NotificationType.BOOKING_CANCELLED;
            }

            Notification n = Notification.builder()
                    .user(user)
                    .type(safeType != null ? safeType : Notification.NotificationType.BOOKING_CONFIRMED)
                    .title(safeTitle != null ? safeTitle : "Thông báo")
                    .body(safeBody)
                    .referenceId(refId)
                    .referenceType(safeRefType)
                    .channel(Notification.NotificationChannel.in_app)
                    .status(Notification.NotificationStatus.sent)
                    .isRead(false)
                    .build();

            Notification saved = notificationRepository.save(n);

            NotificationResponseDTO responseDTO = NotificationResponseDTO.builder()
                    .notificationId(saved.getNotificationId())
                    .type(saved.getType())
                    .title(saved.getTitle())
                    .body(saved.getBody())
                    .referenceId(saved.getReferenceId())
                    .referenceType(saved.getReferenceType())
                    .channel(saved.getChannel())
                    .isRead(false)
                    .createdAt(saved.getCreatedAt())
                    .build();

            sseService.pushToUser(userId, responseDTO);
        } catch (Exception e) {
            log.error("Failed to send notification in isolated transaction to userId={}: {}", userId, e.getMessage());
        }
    }
}
