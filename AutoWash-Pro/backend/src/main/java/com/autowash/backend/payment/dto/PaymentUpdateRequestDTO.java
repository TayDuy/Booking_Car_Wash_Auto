package com.autowash.backend.payment.dto;

import com.autowash.backend.payment.entity.Payment.PaymentStatus;
import jakarta.validation.constraints.NotNull;
import lombok.*;

/**
 * DTO nhận trạng thái mới khi cập nhật payment.
 *
 * State machine hợp lệ:
 *   unpaid  → paid       (thanh toán thành công)
 *   unpaid  → cancelled  (huỷ trước khi thanh toán)
 *   failed  → paid       (retry thanh toán)
 *   paid    → (không cho phép chuyển — terminal state)
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentUpdateRequestDTO {

    @NotNull(message = "Payment status không được null")
    private PaymentStatus paymentStatus;
}