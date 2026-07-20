// backend/src/main/java/com/autowash/backend/refund/entity/Refund.java
package com.autowash.backend.refund.entity;

import com.autowash.backend.customer.entity.Customer;
import com.autowash.backend.employee.entity.Employee;
import com.autowash.backend.payment.entity.Payment;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "refund")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@ToString(exclude = {"payment", "requestedBy", "requestedByCustomer", "processedBy"})
public class Refund {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "refund_id")
    @EqualsAndHashCode.Include
    private Integer refundId;

    @NotNull(message = "Payment không được null")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payment_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_refund_payment"))
    private Payment payment;

    @NotNull(message = "Số tiền hoàn không được null")
    @DecimalMin(value = "0.0", inclusive = false, message = "Số tiền hoàn phải lớn hơn 0")
    @Digits(integer = 10, fraction = 2)
    @Column(name = "amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @NotBlank(message = "Lý do hoàn tiền không được để trống")
    @Size(max = 500, message = "Lý do tối đa 500 ký tự")
    @Column(name = "reason", nullable = false, length = 500)
    private String reason;

    @NotNull(message = "Phương thức hoàn tiền không được null")
    @Column(name = "refund_method", nullable = false, length = 15)
    @Enumerated(EnumType.STRING)
    private RefundMethod refundMethod;

    @Size(max = 100)
    @Column(name = "bank_name", length = 100)
    private String bankName;

    @Size(max = 30)
    @Column(name = "bank_account_number", length = 30)
    private String bankAccountNumber;

    @Size(max = 100)
    @Column(name = "bank_account_name", length = 100)
    private String bankAccountName;

    @NotNull(message = "Status không được null")
    @Column(name = "status", nullable = false, length = 15)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private RefundStatus status = RefundStatus.pending;

    @Size(max = 500, message = "Ghi chú tối đa 500 ký tự")
    @Column(name = "admin_note", length = 500)
    private String adminNote;

    /**
     * Nhân viên tạo yêu cầu hoàn tiền THAY MẶT khách hàng (luồng tại quầy/nhân viên xử lý).
     * NULL khi yêu cầu do chính khách hàng tự bấm gửi (xem {@link #requestedByCustomer}).
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requested_by",
            foreignKey = @ForeignKey(name = "fk_refund_requested_by"))
    private Employee requestedBy;

    /**
     * Khách hàng tự gửi yêu cầu hoàn tiền (luồng tự phục vụ trên app/web).
     * NULL khi yêu cầu do nhân viên tạo thay mặt khách (xem {@link #requestedBy}).
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requested_by_customer",
            foreignKey = @ForeignKey(name = "fk_refund_requested_by_customer"))
    private Customer requestedByCustomer;

    /** Admin đã xử lý (duyệt/từ chối) — null khi còn pending. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "processed_by",
            foreignKey = @ForeignKey(name = "fk_refund_processed_by"))
    private Employee processedBy;

    @Column(name = "processed_at")
    private LocalDateTime processedAt;

    /** Nhân viên/kế toán đã xác nhận chuyển tiền xong (chỉ có khi status = completed). */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "completed_by",
            foreignKey = @ForeignKey(name = "fk_refund_completed_by"))
    private Employee completedBy;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Size(max = 500, message = "Ghi chú hoàn tất tối đa 500 ký tự")
    @Column(name = "completion_note", length = 500)
    private String completionNote;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    public boolean isOpen() {
        return RefundStatus.pending.equals(this.status)
                || RefundStatus.processing.equals(this.status)
                || RefundStatus.approved.equals(this.status);
    }

    public boolean canMarkProcessing() {
        return RefundStatus.pending.equals(this.status);
    }

    public boolean canDecide() {
        return RefundStatus.pending.equals(this.status)
                || RefundStatus.processing.equals(this.status);
    }

    public boolean canComplete() {
        return RefundStatus.approved.equals(this.status);
    }

    public void approve(Employee admin, String note) {
        this.status = RefundStatus.approved;
        this.processedBy = admin;
        this.adminNote = note;
        this.processedAt = LocalDateTime.now();
    }

    public void reject(Employee admin, String note) {
        this.status = RefundStatus.rejected;
        this.processedBy = admin;
        this.adminNote = note;
        this.processedAt = LocalDateTime.now();
    }

    public void complete(Employee staff, String note) {
        this.status = RefundStatus.completed;
        this.completedBy = staff;
        this.completionNote = note;
        this.completedAt = LocalDateTime.now();
    }

    public enum RefundMethod { cash, bank_transfer }

    public enum RefundStatus { pending, processing, approved, completed, rejected }
}