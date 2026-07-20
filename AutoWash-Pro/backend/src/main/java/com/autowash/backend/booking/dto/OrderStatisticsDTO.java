package com.autowash.backend.booking.dto;

import java.math.BigDecimal;

public record OrderStatisticsDTO(
        long total,
        long checkedIn,
        long inProgress,
        long completed,
        BigDecimal totalValue
) {}
