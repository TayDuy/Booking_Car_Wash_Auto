package com.autowash.backend.notification.service;

import com.autowash.backend.notification.dto.*;

import java.util.List;

public interface NotificationService {

    NotificationResponseDTO create(NotificationCreateDTO dto);

    BulkNotificationResponseDTO createBulk(BulkNotificationRequestDTO dto);

    List<NotificationResponseDTO> getByUser(Integer userId);

    List<NotificationResponseDTO> getUnreadByUser(Integer userId);

    UnreadCountResponseDTO countUnread(Integer userId);

    void markAsRead(Integer notificationId, Integer userId);

    void markAllAsRead(Integer userId);

    void delete(Integer notificationId, Integer userId);
    void deleteAll(Integer userId);

    /**
     * Admin thu hồi (xoá) một notification bất kỳ của user bất kỳ.
     * Không kiểm tra ownership vì chỉ ADMIN mới được gọi
     * (kiểm soát ở tầng Controller qua @PreAuthorize).
     */
    void adminRevoke(Integer notificationId);
}