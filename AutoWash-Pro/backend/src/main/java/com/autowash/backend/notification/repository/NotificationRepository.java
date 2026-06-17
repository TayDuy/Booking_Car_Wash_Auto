package com.autowash.backend.notification.repository;

import com.autowash.backend.notification.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/**
 * Repository cho Notification — Spring Data tự generate SQL từ method name.
 */
public interface NotificationRepository extends JpaRepository<Notification, Integer> {

    /**
     * Lấy tất cả notification của user, sắp xếp mới nhất trước.
     * Dùng cho màn hình inbox của user.
     */
    List<Notification> findByUserIdOrderByCreatedAtDesc(Integer userId);

    /**
     * Chỉ lấy notification chưa đọc của user, mới nhất trước.
     * Dùng khi user mở panel thông báo.
     */
    List<Notification> findByUserIdAndIsReadFalseOrderByCreatedAtDesc(Integer userId);

    /**
     * Đếm số notification chưa đọc.
     * Dùng cho badge số trên icon thông báo — client poll định kỳ.
     */
    long countByUserIdAndIsReadFalse(Integer userId);
}