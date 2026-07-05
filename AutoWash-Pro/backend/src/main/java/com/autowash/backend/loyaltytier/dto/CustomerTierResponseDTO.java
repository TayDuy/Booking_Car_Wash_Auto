package com.autowash.backend.loyaltytier.dto;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Builder
public class CustomerTierResponseDTO {
    private Integer customerId;
    private Integer tierId;
    private String tierName;
    private Integer currentPoints;
    private Integer totalVisits;
    private BigDecimal totalSpending;
}
