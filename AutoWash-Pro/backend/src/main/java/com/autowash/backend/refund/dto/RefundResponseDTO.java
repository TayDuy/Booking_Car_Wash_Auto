// backend/src/main/java/com/autowash/backend/refund/dto/RefundResponseDTO.java
package com.autowash.backend.refund.dto;

import com.autowash.backend.refund.entity.Refund.RefundMethod;
import com.autowash.backend.refund.entity.Refund.RefundStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Builder
public class RefundResponseDTO {
    private Integer refundId;
    private Integer paymentId;
    private Integer bookingId;
    private String bookingCode;
    private String customerName;
    private String customerPhone;
    private BigDecimal originalFinalAmount;
    private BigDecimal amount;
    private String reason;
    private RefundMethod refundMethod;
    private String bankName;
    private String bankAccountNumber;
    private String bankAccountName;
    private RefundStatus status;
    private String adminNote;
    private Integer requestedById;
    private String requestedByName;
    /** "customer" nếu khách hàng tự gửi, "employee" nếu nhân viên/admin tạo hộ. */
    private String requestedByRole;
    private Integer processedById;
    private String processedByName;
    private LocalDateTime processedAt;
    private Integer completedById;
    private String completedByName;
    private LocalDateTime completedAt;
    private String completionNote;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}