package com.autowash.backend.notification.service.impl;

import com.autowash.backend.customer.entity.Customer;
import com.autowash.backend.customer.repository.CustomerRepository;
import com.autowash.backend.loyaltytier.entity.LoyaltyTier;
import com.autowash.backend.loyaltytier.repository.LoyaltyTierRepository;
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

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final SseService sseService;
    private final CustomerRepository customerRepository;
    private final LoyaltyTierRepository loyaltyTierRepository;

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

        NotificationResponseDTO response = toResponse(notificationRepository.save(notification));
        sseService.pushToUser(dto.getUserId(), response);

        return response;
    }

    @Override
    @Transactional
    public BulkNotificationResponseDTO createBulk(BulkNotificationRequestDTO dto) {
        List<User> targets;
        String targetDescription;

        if (dto.getMinTierId() != null) {
            LoyaltyTier minTier = loyaltyTierRepository.findById(dto.getMinTierId())
                    .orElseThrow(() -> new EntityNotFoundException(
                            "Tier không tồn tại: " + dto.getMinTierId()));

            List<Integer> qualifyingTierIds = loyaltyTierRepository
                    .findByIsActiveTrueOrderByPriorityLevelDesc()
                    .stream()
                    .filter(t -> t.getPriorityLevel() != null
                            && minTier.getPriorityLevel() != null
                            && t.getPriorityLevel() >= minTier.getPriorityLevel())
                    .map(LoyaltyTier::getTierId)
                    .toList();

            targets = customerRepository
                    .findByTierIdInAndUser_Status(qualifyingTierIds, "active")
                    .stream()
                    .map(Customer::getUser)
                    .toList();

            targetDescription = minTier.getTierName() + " trở lên";
        } else if (dto.getUserIds() == null || dto.getUserIds().isEmpty()) {
            targets = userRepository.findByStatus("active");
            targetDescription = "Tất cả khách hàng đang hoạt động";
        } else {
            targets = userRepository.findAllById(dto.getUserIds());
            targetDescription = targets.size() + " người dùng được chọn";
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

        List<Notification> saved = notificationRepository.saveAll(notifications);

        saved.forEach(n ->
                sseService.pushToUser(n.getUser().getId(), toResponse(n)));

        return BulkNotificationResponseDTO.builder()
                .totalSent(saved.size())
                .title(dto.getTitle())
                .targetDescription(targetDescription)
                .build();
    }

    @Override
    public List<NotificationResponseDTO> getByUser(Integer userId) {
        return notificationRepository
                .findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public List<NotificationResponseDTO> getUnreadByUser(Integer userId) {
        return notificationRepository
                .findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public UnreadCountResponseDTO countUnread(Integer userId) {
        long count = notificationRepository.countByUserIdAndIsReadFalse(userId);
        return new UnreadCountResponseDTO(userId, count);
    }

    @Override
    @Transactional
    public void markAsRead(Integer notificationId, Integer userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Notification không tồn tại: " + notificationId));

        if (!notification.getUser().getId().equals(userId)) {
            throw new SecurityException("Không có quyền truy cập notification này.");
        }

        notification.markAsRead();
        notificationRepository.save(notification);
    }

    @Override
    @Transactional
    public void markAllAsRead(Integer userId) {
        List<Notification> unread = notificationRepository
                .findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId);

        unread.forEach(Notification::markAsRead);
        notificationRepository.saveAll(unread);
    }

    private User findUserOrThrow(Integer userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "User không tồn tại: " + userId));
    }

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

    @Override
    @Transactional
    public void delete(Integer notificationId, Integer userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Notification không tồn tại: " + notificationId));

        if (!notification.getUser().getId().equals(userId)) {
            throw new SecurityException("Không có quyền truy cập notification này.");
        }

        notificationRepository.delete(notification);
    }

    @Override
    @Transactional
    public void deleteAll(Integer userId) {
        notificationRepository.deleteByUserId(userId);
    }

    @Override
    @Transactional
    public void adminRevoke(Integer notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Notification không tồn tại: " + notificationId));

        Integer ownerId = notification.getUser().getId();

        notificationRepository.delete(notification);

        sseService.pushRevoke(ownerId, notificationId);
    }
}