package com.autowash.backend.loyaltytransaction.dto;

import lombok.*;

import java.time.LocalDateTime;

/**
 * DTO trả về lịch sử giao dịch điểm của customer.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoyaltyTransactionResponseDTO {

    private Long loyaltyTransactionId;

    private Integer customerId;

    private Long paymentId;

    private String transactionType;

    private Integer points;

    private Integer balanceBefore;

    private Integer balanceAfter;

    private LocalDateTime expiredAt;

    private LocalDateTime createdAt;

    private String note;
}
