package com.autowash.backend.payment.entity;

import com.autowash.backend.booking.entity.Booking;
//import com.autowash.backend.loyalty.entity.Reward;       // ← fix package
//import com.autowash.backend.voucher.entity.Promotion;   // ← fix package
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
    private Integer paymentId;

    @NotNull(message = "Booking không được null")
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", nullable = false, unique = true,
            foreignKey = @ForeignKey(name = "fk_payment_booking"))
    private Booking booking;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "promotion_id",
            foreignKey = @ForeignKey(name = "fk_payment_promotion"))
    private Promotion promotion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reward_id",
            foreignKey = @ForeignKey(name = "fk_payment_reward"))
    private Reward reward;

    @NotNull
    @DecimalMin(value = "0.0", inclusive = false, message = "Số tiền gốc phải lớn hơn 0")
    @Digits(integer = 10, fraction = 2)
    @Column(name = "original_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal originalAmount;

    @NotNull
    @DecimalMin(value = "0.0", message = "Discount không được âm")
    @Digits(integer = 10, fraction = 2)
    @Column(name = "discount_amount", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal discountAmount = BigDecimal.ZERO;

    @NotNull
    @DecimalMin(value = "0.0", message = "Số tiền cuối không được âm")
    @Digits(integer = 10, fraction = 2)
    @Column(name = "final_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal finalAmount;

    @NotNull(message = "Phương thức thanh toán không được null")
    @Column(name = "payment_method", nullable = false, length = 15)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private PaymentMethod paymentMethod = PaymentMethod.cash;

    @NotNull(message = "Payment status không được null")
    @Column(name = "payment_status", nullable = false, length = 10)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private PaymentStatus paymentStatus = PaymentStatus.unpaid;

    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    @Column(name = "vnpay_transaction_no", length = 50)
    private String vnpayTransactionNo;

    @Column(name = "vnpay_bank_code", length = 20)
    private String vnpayBankCode;

    @Column(name = "vnpay_card_type", length = 20)
    private String vnpayCardType;

    @Column(name = "vnpay_response_code", length = 10)
    private String vnpayResponseCode;

    // ← Quản lý thủ công vì schema DB không có created_at/updated_at.
    //    Nếu muốn dùng @CreatedDate/@LastModifiedDate thì cần thêm
    //    2 cột này vào bảng payment trong DB và bật @EnableJpaAuditing.
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

    public enum PaymentMethod { cash, bank_transfer, pos }
    public enum PaymentStatus { unpaid, paid, failed, cancelled }
}