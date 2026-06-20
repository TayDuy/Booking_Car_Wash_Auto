package com.autowash.backend.notification.service;

import com.autowash.backend.notification.dto.*;

import java.util.List;

/**
 * Contract nghiệp vụ cho Notification (FR-12).
 *
 * <p>Hai luồng tạo notification:
 * <ul>
 *   <li>Admin tạo thủ công 1 user → {@link #create}</li>
 *   <li>Admin broadcast nhiều user → {@link #createBulk}</li>
 * </ul>
 * </p>
 */
public interface NotificationService {

    /**
     * Admin tạo thủ công một notification gửi đến user cụ thể.
     *
     * @param dto thông tin notification và userId nhận
     * @return notification vừa tạo dưới dạng DTO
     */
    NotificationResponseDTO create(NotificationCreateDTO dto);

    /**
     * Admin gửi thông báo hàng loạt đến nhiều user.
     * Nếu userIds null/rỗng → broadcast đến tất cả user active.
     *
     * @param dto thông tin notification và danh sách userId nhận
     * @return kết quả gồm số lượng đã gửi và tiêu đề
     */
    BulkNotificationResponseDTO createBulk(BulkNotificationRequestDTO dto);

    /**
     * Lấy tất cả notification của một user, mới nhất trước.
     *
     * @param userId ID user cần lấy thông báo
     */
    List<NotificationResponseDTO> getByUser(Integer userId);

    /**
     * Lấy danh sách notification chưa đọc của user.
     *
     * @param userId ID user cần lấy
     */
    List<NotificationResponseDTO> getUnreadByUser(Integer userId);

    /**
     * Đếm số notification chưa đọc — dùng cho badge UI.
     *
     * @param userId ID user cần đếm
     */
    UnreadCountResponseDTO countUnread(Integer userId);

    /**
     * Đánh dấu một notification là đã đọc.
     * Kiểm tra ownership — chỉ owner mới được mark.
     *
     * @param notificationId ID notification cần đánh dấu
     * @param userId         ID user sở hữu notification
     */
    void markAsRead(Integer notificationId, Integer userId);

    /**
     * Đánh dấu tất cả notification của user là đã đọc.
     *
     * @param userId ID user cần mark all
     */
    void markAllAsRead(Integer userId);
}