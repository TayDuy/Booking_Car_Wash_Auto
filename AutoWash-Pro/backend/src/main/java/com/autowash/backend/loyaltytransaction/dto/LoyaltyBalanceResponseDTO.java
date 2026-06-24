package com.autowash.backend.loyaltytransaction.dto;

import lombok.*;

import java.time.LocalDateTime;

/**
 * DTO trả về số điểm hiện tại của customer.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoyaltyBalanceResponseDTO {

    private Integer customerId;

    private Integer currentPoints;

    private LocalDateTime lastUpdatedAt;
}
