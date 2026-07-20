// backend/src/main/java/com/autowash/backend/refund/dto/RefundCustomerCreateRequestDTO.java
package com.autowash.backend.refund.dto;

import com.autowash.backend.refund.entity.Refund.RefundMethod;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RefundCustomerCreateRequestDTO {

    @NotNull(message = "Booking ID không được null")
    private Integer bookingId;

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