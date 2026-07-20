// backend/src/main/java/com/autowash/backend/refund/dto/RefundDecisionDTO.java
package com.autowash.backend.refund.dto;

import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RefundDecisionDTO {

    @Size(max = 500, message = "Ghi chú tối đa 500 ký tự")
    private String adminNote;
}