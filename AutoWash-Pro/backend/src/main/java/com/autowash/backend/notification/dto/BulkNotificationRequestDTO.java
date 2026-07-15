package com.autowash.backend.notification.dto;

import com.autowash.backend.notification.entity.Notification;
import jakarta.validation.constraints.*;
import lombok.*;

import java.util.List;

/**
 * DTO admin dùng để gửi thông báo hàng loạt đến nhiều user.
 *
 * <p>Ví dụ use case:
 * <ul>
 *   <li>Thông báo khuyến mãi mới đến tất cả khách hàng</li>
 *   <li>Thông báo lịch bảo trì hệ thống</li>
 *   <li>Gửi đến nhóm user cụ thể theo danh sách</li>
 * </ul>
 * </p>
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BulkNotificationRequestDTO {

    /**
     * Danh sách userId nhận thông báo.
     * Nếu null hoặc rỗng → broadcast đến tất cả user có status = active.
     * Bỏ qua nếu {@code minTierId} được truyền.
     */
    private List<Integer> userIds;

    /**
     * FR-4: gửi thông báo theo hạng thành viên tối thiểu, ví dụ "Silver trở lên".
     * Là tierId của hạng làm mốc — hệ thống sẽ gửi tới mọi customer có
     * tier với priorityLevel >= priorityLevel của tier này.
     * Nếu truyền field này thì {@code userIds} sẽ bị bỏ qua.
     */
    private Integer minTierId;

    /** Loại sự kiện thông báo. */
    @NotNull(message = "Type không được null")
    private Notification.NotificationType type;

    /** Tiêu đề hiển thị — tối đa 100 ký tự. */
    @NotBlank(message = "Tiêu đề không được để trống")
    @Size(max = 100)
    private String title;

    /** Nội dung chi tiết — tối đa 500 ký tự. Nullable. */
    @Size(max = 500)
    private String body;

    /**
     * Kênh gửi — admin chọn.
     * Default in_app nếu không chỉ định.
     */
    @Builder.Default
    private Notification.NotificationChannel channel
            = Notification.NotificationChannel.in_app;
}