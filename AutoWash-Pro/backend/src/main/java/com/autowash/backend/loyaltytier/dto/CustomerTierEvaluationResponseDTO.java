package com.autowash.backend.loyaltytier.dto;

import java.math.BigDecimal;

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
