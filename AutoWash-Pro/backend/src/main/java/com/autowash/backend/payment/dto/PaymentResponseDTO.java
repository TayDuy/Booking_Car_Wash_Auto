package com.autowash.backend.payment.dto;


import com.autowash.backend.payment.entity.Payment.PaymentMethod;
import com.autowash.backend.payment.entity.Payment.PaymentStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DTO trả về sau mọi thao tác với payment (create, update, get).
 *
 * Không trả trực tiếp entity Payment để:
 *   - Tránh lộ thông tin nhạy cảm.
 *   - Tránh vấn đề lazy-load khi serialize JSON.
 *   - Flatten quan hệ (booking, promotion, reward) thành các field phẳng.
 */
@Getter
@Builder
public class PaymentResponseDTO {

    private Integer paymentId;

    /** ID và mã booking liên quan — khách dùng bookingCode để tra cứu. */
    private Integer bookingId;
    private String  bookingCode;

    /** Thông tin promotion đã áp dụng — null nếu không dùng promotion. */
    private Integer promotionId;
    private String  promotionName;

    /** Thông tin reward đã redeem — null nếu không đổi điểm. */
    private Integer rewardId;
    private String  rewardName;

    /** Tổng tiền gốc = sum(subTotal) của tất cả booking_detail. */
    private BigDecimal originalAmount;

    /** Số tiền được giảm = discount từ promotion + reward. */
    private BigDecimal discountAmount;

    /** Số tiền thực thu = originalAmount - discountAmount. */
    private BigDecimal finalAmount;

    private PaymentMethod paymentMethod;
    private PaymentStatus paymentStatus;

    /** Thời điểm thanh toán thành công — null nếu chưa paid. */
    private LocalDateTime paidAt;

    private String vnpayTransactionNo;
    private String vnpayBankCode;
    private String vnpayCardType;
    private String vnpayResponseCode;

    /** Audit timestamps. */
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

}