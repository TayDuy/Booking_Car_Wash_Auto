// backend/src/main/java/com/autowash/backend/refund/dto/RefundLookupResponseDTO.java
package com.autowash.backend.refund.dto;

import lombok.*;
import java.math.BigDecimal;

@Getter
@Builder
public class RefundLookupResponseDTO {
    private Integer paymentId;
    private Integer bookingId;
    private String bookingCode;
    private String customerName;
    private String customerPhone;
    private BigDecimal finalAmount;
    private String paymentStatus;
    private boolean eligible;
    private String ineligibleReason;
}