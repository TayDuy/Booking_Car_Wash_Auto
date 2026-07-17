package com.autowash.backend.payment.dto;

import com.autowash.backend.payment.entity.Payment.PaymentMethod;
import jakarta.validation.constraints.NotNull;
import lombok.*;

/**
 * DTO nhận dữ liệu từ client khi tạo payment.
 *
 * Flow: booking completed → client gọi POST /api/payments với DTO này.
 * originalAmount KHÔNG nhận từ client — service tự tính từ booking_detail
 * để tránh client gửi sai số tiền.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentCreateRequestDTO {

    /** ID booking đã completed cần thanh toán. */
    @NotNull(message = "Booking ID không được null")
    private Integer bookingId;

    /** Phương thức thanh toán: cash / bank_transfer / pos. */
    @NotNull(message = "Phương thức thanh toán không được null")
    private PaymentMethod paymentMethod;

    /**
     * ID promotion muốn áp dụng — nullable.
     * Null = không dùng promotion.
     * Service sẽ validate promotion còn hiệu lực và đúng tier khách hàng.
     */
    private Integer promotionId;

    /**
     * ID reward muốn redeem — nullable.
     * Null = không đổi điểm.
     * Service sẽ validate khách đủ điểm và reward còn active.
     */
    private Integer rewardId;

    /**
     * Mã voucher của khách hàng (đổi thưởng/khuyến mãi) muốn áp dụng.
     */
    private String voucherCode;
}