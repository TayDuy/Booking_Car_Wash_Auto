package com.autowash.backend.notification.entity;

import com.autowash.backend.user.entity.User;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

/**
 * FR-12: Lịch sử thông báo in-app + tracking trạng thái gửi SMS/Email.
 *
 * ⚠ Bảng này chưa có trong DB schema gốc — cần thêm migration:
 * <pre>
 * CREATE TABLE notification (
 *     notification_id SERIAL       PRIMARY KEY,
 *     user_id         INT          NOT NULL REFERENCES account(user_id),
 *     type            VARCHAR(30)  NOT NULL,
 *     title           VARCHAR(100) NOT NULL,
 *     body            VARCHAR(500),
 *     reference_id    INT,
 *     reference_type  VARCHAR(30),
 *     is_read         BOOLEAN      NOT NULL DEFAULT FALSE,
 *     channel         VARCHAR(10)  NOT NULL DEFAULT 'in_app',
 *     status          VARCHAR(15)  NOT NULL DEFAULT 'sent',
 *     retry_count     INT          NOT NULL DEFAULT 0,
 *     created_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
 *     updated_at      TIMESTAMP
 * );
 * CREATE INDEX idx_notification_user_unread ON notification(user_id, is_read);
 * </pre>
 *
 * Luồng FR-12:
 *  Trigger → publish RabbitMQ → BookingCompletedListener
 *    → gửi SMS/Email (external)  → lưu record channel = sms/email
 *    → lưu record channel = in_app (history)
 *  Thất bại → retryCount++ → sau MAX_RETRY → status = dead_lettered
 */
@Entity
@Table(
        name = "notification",
        indexes = {
                @Index(name = "idx_notification_user_unread", columnList = "user_id, is_read")
        }
)
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@ToString(exclude = "user")
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "notification_id")
    @EqualsAndHashCode.Include
    private Integer notificationId;

    @NotNull(message = "User không được null")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_notification_user"))
    private User user;

    @NotNull(message = "Type không được null")
    @Column(name = "type", nullable = false, length = 30)
    @Enumerated(EnumType.STRING)
    private NotificationType type;

    @NotBlank(message = "Tiêu đề không được để trống")
    @Size(max = 100)
    @Column(name = "title", nullable = false, length = 100)
    private String title;

    @Size(max = 500)
    @Column(name = "body", length = 500)
    private String body;

    /**
     * FR-12: referenceId + referenceType cho phép link tới bất kỳ entity nào
     * (booking, payment...) mà không cần FK cứng — linh hoạt khi thêm loại mới.
     */
    @Column(name = "reference_id")
    private Integer referenceId;

    @Size(max = 30)
    @Column(name = "reference_type", length = 30)
    private String referenceType;

    /** FR-12: user đánh dấu đã đọc — dùng cho badge unread count. */
    @Column(name = "is_read", nullable = false)
    @Builder.Default
    private Boolean isRead = false;

    @NotNull
    @Column(name = "channel", nullable = false, length = 10)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private NotificationChannel channel = NotificationChannel.in_app;

    /**
     * FR-12: tracking trạng thái gửi.
     *  sent         → gửi thành công
     *  failed       → thất bại, chờ retry
     *  dead_lettered → vượt MAX_RETRY, log lại để xử lý thủ công
     */
    @NotNull
    @Column(name = "status", nullable = false, length = 15)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private NotificationStatus status = NotificationStatus.sent;

    /** FR-12: đếm số lần retry — tối đa theo config (mặc định 3). */
    @Min(value = 0)
    @Column(name = "retry_count", nullable = false)
    @Builder.Default
    private Integer retryCount = 0;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum NotificationType {
        BOOKING_CONFIRMED, BOOKING_CANCELLED, BOOKING_RESCHEDULED,
        WAITLIST_PROMOTED, TIER_UPGRADED, TIER_DOWNGRADED, PAYMENT_COMPLETED, PAYMENT_FAILED,
        RATING_ALERT, REFUND_REQUESTED, REFUND_PROCESSING, REFUND_APPROVED, REFUND_REJECTED,
        REFUND_COMPLETED
    }

    public enum NotificationChannel { in_app, sms, email }

    public enum NotificationStatus { sent, failed, dead_lettered }

    // ── FR-12 Helpers ────────────────────────────────────────────────────────

    public void markAsRead()      { this.isRead = true; }
    public void incrementRetry()  { this.retryCount++; }
    public void markDeadLettered(){ this.status = NotificationStatus.dead_lettered; }
}