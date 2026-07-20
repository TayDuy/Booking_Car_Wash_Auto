// backend/src/main/java/com/autowash/backend/refund/dto/RefundSelfRequestDTO.java
package com.autowash.backend.refund.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RefundSelfRequestDTO {

    @NotNull(message = "Payment ID không được null")
    private Integer paymentId;

    @NotBlank(message = "Vui lòng nhập lý do hoàn tiền")
    @Size(max = 500, message = "Lý do tối đa 500 ký tự")
    private String reason;
}