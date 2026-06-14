package com.autowash.backend.notification.dto;

import com.autowash.backend.notification.entity.Notification;
import lombok.*;

import java.time.LocalDateTime;

/**
 * DTO trả về cho client sau mọi thao tác GET / CREATE.
 *
 * <p>Không expose User entity trực tiếp —
 * chỉ lấy userId và username cần thiết.</p>
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationResponseDTO {

    private Integer notificationId;

    /** ID người nhận thông báo. */
    private Integer userId;

    /** Username người nhận — tiện hiển thị ở admin dashboard. */
    private String username;

    /** Loại sự kiện: BOOKING_CONFIRMED, PAYMENT_COMPLETED... */
    private Notification.NotificationType type;

    /** Tiêu đề hiển thị trên UI. */
    private String title;

    /** Nội dung chi tiết của thông báo. */
    private String body;

    /**
     * ID entity liên quan (booking_id, payment_id...).
     * Client dùng để navigate đến màn hình tương ứng.
     */
    private Integer referenceId;

    /** Loại entity liên quan: "booking", "payment"... */
    private String referenceType;

    /** Khách đã đọc thông báo này chưa — dùng cho badge unread count. */
    private Boolean isRead;

    /** Kênh gửi: in_app / sms / email. */
    private Notification.NotificationChannel channel;

    /** Trạng thái gửi: sent / failed / dead_lettered. */
    private Notification.NotificationStatus status;

    /** Số lần đã retry khi gửi thất bại — max 3 lần theo config. */
    private Integer retryCount;

    /** Thời điểm tạo — set tự động bởi JPA Auditing. */
    private LocalDateTime createdAt;

    /** Thời điểm cập nhật lần cuối — set tự động bởi JPA Auditing. */
    private LocalDateTime updatedAt;
}