// backend/src/main/java/com/autowash/backend/refund/dto/RefundCreateRequestDTO.java
package com.autowash.backend.refund.dto;

import com.autowash.backend.refund.entity.Refund.RefundMethod;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RefundCreateRequestDTO {

    @NotNull(message = "Payment ID không được null")
    private Integer paymentId;

    @NotNull(message = "Số tiền hoàn không được null")
    @DecimalMin(value = "0.0", inclusive = false, message = "Số tiền hoàn phải lớn hơn 0")
    private BigDecimal amount;

    @NotBlank(message = "Lý do hoàn tiền không được để trống")
    @Size(max = 500, message = "Lý do tối đa 500 ký tự")
    private String reason;

    @NotNull(message = "Phương thức hoàn tiền không được null")
    private RefundMethod refundMethod;

    @Size(max = 100)
    private String bankName;

    @Size(max = 30)
    private String bankAccountNumber;

    @Size(max = 100)
    private String bankAccountName;
}