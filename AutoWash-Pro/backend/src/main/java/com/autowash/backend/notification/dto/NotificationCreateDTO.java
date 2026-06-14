package com.autowash.backend.notification.dto;

import com.autowash.backend.notification.entity.Notification;
import jakarta.validation.constraints.*;
import lombok.*;

/**
 * DTO admin dùng để tạo thủ công một notification gửi đến user cụ thể.
 *
 * <p>Khác với system-driven (tự động sau sự kiện),
 * DTO này cho phép admin chủ động gửi thông báo bất kỳ lúc nào.</p>
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationCreateDTO {

    /**
     * ID user nhận thông báo — admin chỉ định.
     * Không lấy từ JWT của người gửi.
     */
    @NotNull(message = "UserId không được null")
    private Integer userId;

    /**
     * Loại sự kiện thông báo.
     * Ví dụ: BOOKING_CONFIRMED, PAYMENT_COMPLETED...
     */
    @NotNull(message = "Type không được null")
    private Notification.NotificationType type;

    /** Tiêu đề hiển thị trên UI — tối đa 100 ký tự. */
    @NotBlank(message = "Tiêu đề không được để trống")
    @Size(max = 100)
    private String title;

    /** Nội dung chi tiết — tối đa 500 ký tự. Nullable. */
    @Size(max = 500)
    private String body;

    /**
     * ID entity liên quan (booking_id, payment_id...).
     * Nullable — admin có thể không link đến entity nào.
     */
    private Integer referenceId;

    /**
     * Loại entity liên quan: "booking", "payment"...
     * Nullable — kết hợp với referenceId để client navigate.
     */
    @Size(max = 30)
    private String referenceType;

    /**
     * Kênh gửi thông báo.
     * Admin có thể chọn: in_app / sms / email.
     * Default in_app nếu không chỉ định.
     */
    @Builder.Default
    private Notification.NotificationChannel channel
            = Notification.NotificationChannel.in_app;
}