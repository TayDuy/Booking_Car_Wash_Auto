package com.autowash.backend.notification.repository;

import com.autowash.backend.notification.entity.Notification;
import com.autowash.backend.notification.entity.Notification.NotificationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * FR-12: Repository cho Notification.
 * Lưu ý: các method dùng "User_Id" (không phải "User_UserId")
 * vì field PK trong entity User tên là "id", không phải "userId".
 */
@Repository
public interface NotificationRepository extends JpaRepository<Notification, Integer> {

    /**
     * Lấy toàn bộ thông báo của user, mới nhất trước.
     * Dùng cho trang lịch sử thông báo.
     */
    List<Notification> findByUser_IdOrderByCreatedAtDesc(Integer userId);

    /**
     * Lấy các thông báo chưa đọc của user, mới nhất trước.
     * Dùng để hiển thị danh sách unread.
     */
    List<Notification> findByUser_IdAndIsReadFalseOrderByCreatedAtDesc(Integer userId);

    /**
     * Đếm số thông báo chưa đọc — dùng cho badge unread count trên UI.
     */
    long countByUser_IdAndIsReadFalse(Integer userId);

    /**
     * FR-12: Lấy các notification failed chưa vượt maxRetry.
     * Dùng cho retry job chạy định kỳ — tránh scan toàn bảng nhờ partial index.
     */
    List<Notification> findByStatusAndRetryCountLessThan(NotificationStatus status, Integer maxRetry);

    /**
     * FR-12: Đánh dấu toàn bộ thông báo của user là đã đọc trong 1 query.
     * Dùng cho tính năng "Đọc tất cả" trên UI — hiệu quả hơn update từng record.
     * @Modifying bắt buộc cho câu UPDATE/DELETE trong JPQL.
     */
    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true WHERE n.user.id = :userId AND n.isRead = false")
    int markAllAsRead(@Param("userId") Integer userId);
}