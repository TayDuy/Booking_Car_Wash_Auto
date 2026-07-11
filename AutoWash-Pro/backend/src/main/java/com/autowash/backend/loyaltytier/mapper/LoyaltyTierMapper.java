package com.autowash.backend.loyaltytier.mapper;

import com.autowash.backend.customer.entity.Customer;
import com.autowash.backend.loyaltytier.dto.CustomerTierEvaluationResponseDTO;
import com.autowash.backend.loyaltytier.entity.LoyaltyTier;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

/**
 * Mapper cho module LoyaltyTier.
 *
 * Nhiệm vụ:
 * - Chuyển dữ liệu sau khi service đánh giá hạng thành ResponseDTO.
 * - Mapper không xử lý business logic.
 * - Logic phân hạng nằm trong LoyaltyTierEvaluationServiceImpl.
 */
@Component
public class LoyaltyTierMapper {

    public CustomerTierEvaluationResponseDTO toEvaluationResponse(
            Customer customer,
            Integer previousTierId,
            String previousTierName,
            LoyaltyTier matchedTier,
            Integer currentPoints,
            Integer currentBalance,
            Integer totalVisits,
            BigDecimal totalSpending,
            String message
    ) {
        return CustomerTierEvaluationResponseDTO.builder()
                .customerId(customer.getCustomerId())
                .previousTierId(previousTierId)
                .previousTierName(previousTierName)
                .newTierId(matchedTier.getTierId())
                .newTierName(matchedTier.getTierName())
                .currentPoints(currentPoints != null ? currentPoints : 0)
                .currentBalance(currentBalance != null ? currentBalance : 0)
                .totalVisits(totalVisits != null ? totalVisits : 0)
                .totalSpending(totalSpending != null ? totalSpending : BigDecimal.ZERO)
                .message(message)
                .build();
    }
}