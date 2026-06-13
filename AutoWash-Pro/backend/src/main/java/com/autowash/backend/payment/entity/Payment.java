package com.autowash.backend.payment.entity;

import com.autowash.backend.booking.entity.Booking;
import com.autowash.backend.promotion.entity.Promotion;
import com.autowash.backend.reward.entity.Reward;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * FR-5: Thanh toán tạo khi booking → completed.
 *        finalAmount = originalAmount - discountAmount.
 *        Khi paymentStatus = paid → trigger loyalty earn event (FR-7).
 */
@Entity
@Table(name = "payment")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@ToString(exclude = {"booking", "promotion", "reward"})
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "payment_id")
    @EqualsAndHashCode.Include
    /** ID duy nhất của thanh toán */
    private Integer paymentId;

    @NotNull(message = "Booking không được null")
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", nullable = false, unique = true,
            foreignKey = @ForeignKey(name = "fk_payment_booking"))
    /** Giao dịch thanh toán thuộc về một booking duy nhất (Quan hệ 1-1) */
    private Booking booking;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "promotion_id",
            foreignKey = @ForeignKey(name = "fk_payment_promotion"))
    /** Khuyến mãi áp dụng cho thanh toán này (nếu có) */
    private Promotion promotion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reward_id",
            foreignKey = @ForeignKey(name = "fk_payment_reward"))
    /** Điểm thưởng (reward) khách hàng đã quy đổi để lấy mã giảm giá (nếu có) */
    private Reward reward;

    @NotNull
    @DecimalMin(value = "0.0", inclusive = false, message = "Số tiền gốc phải lớn hơn 0")
    @Digits(integer = 10, fraction = 2)
    @Column(name = "original_amount", nullable = false, precision = 12, scale = 2)
    /** Tổng số tiền gốc trước khi trừ khuyến mãi và giảm giá từ reward */
    private BigDecimal originalAmount;

    @NotNull
    @DecimalMin(value = "0.0", message = "Discount không được âm")
    @Digits(integer = 10, fraction = 2)
    @Column(name = "discount_amount", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    /** Tổng số tiền được giảm (áp dụng từ Promotion hoặc Reward) */
    private BigDecimal discountAmount = BigDecimal.ZERO;

    @NotNull
    @DecimalMin(value = "0.0", message = "Số tiền cuối không được âm")
    @Digits(integer = 10, fraction = 2)
    @Column(name = "final_amount", nullable = false, precision = 12, scale = 2)
    /** Số tiền cuối cùng khách hàng thực tế phải trả (originalAmount - discountAmount) */
    private BigDecimal finalAmount;

    @NotNull(message = "Phương thức thanh toán không được null")
    @Column(name = "payment_method", nullable = false, length = 15)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    /** Phương thức thanh toán (Tiền mặt, Chuyển khoản, Máy POS) */
    private PaymentMethod paymentMethod = PaymentMethod.cash;

    @NotNull(message = "Payment status không được null")
    @Column(name = "payment_status", nullable = false, length = 10)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    /** Trạng thái hiện tại của giao dịch thanh toán (unpaid, paid, failed, cancelled) */
    private PaymentStatus paymentStatus = PaymentStatus.unpaid;

    @Column(name = "paid_at")
    /** Thời điểm khách hàng thanh toán thành công (khi status chuyển sang paid) */
    private LocalDateTime paidAt;

    // ← Quản lý thủ công vì schema DB không có created_at/updated_at.
    //    Nếu muốn dùng @CreatedDate/@LastModifiedDate thì cần thêm
    //    2 cột này vào bảng payment trong DB và bật @EnableJpaAuditing.
    @Column(name = "created_at", nullable = false, updatable = false)
    /** Thời gian tạo bản ghi thanh toán */
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    /** Thời gian chỉnh sửa bản ghi lần cuối */
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public enum PaymentMethod { cash, bank_transfer, pos }
    public enum PaymentStatus { unpaid, paid, failed, cancelled }
}