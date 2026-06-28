package com.autowash.backend.loyaltytier.dto;


import lombok.*;

import java.math.BigDecimal;

/**
 * DTO trả kết quả sau khi đánh giá hạng customer.
 */

@Builder
public record CustomerTierEvaluationResponseDTO (
    Integer customerId,
    Integer previousTierId,
    String previousTierName,
    Integer newTierId,
    String newTierName,
    Integer currentPoints,
    Integer totalVisits,
    BigDecimal totalSpending,
    String message
){

}
