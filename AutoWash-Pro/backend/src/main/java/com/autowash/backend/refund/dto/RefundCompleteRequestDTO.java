// backend/src/main/java/com/autowash/backend/refund/dto/RefundCompleteRequestDTO.java
package com.autowash.backend.refund.dto;

import jakarta.validation.constraints.Size;
import lombok.*;

/**
 * Dùng khi nhân viên/kế toán xác nhận đã chuyển tiền xong (cash/bank_transfer)
 * cho một yêu cầu hoàn tiền đã được admin duyệt (status = approved).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RefundCompleteRequestDTO {

    @Size(max = 500, message = "Ghi chú tối đa 500 ký tự")
    private String completionNote;
}