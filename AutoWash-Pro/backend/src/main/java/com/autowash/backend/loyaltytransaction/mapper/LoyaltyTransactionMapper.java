package com.autowash.backend.loyaltytransaction.mapper;

import com.autowash.backend.loyaltytransaction.dto.LoyaltyTransactionResponseDTO;
import com.autowash.backend.loyaltytransaction.entity.LoyaltyTransaction;
import org.springframework.stereotype.Component;

@Component
public class LoyaltyTransactionMapper {

    public LoyaltyTransactionResponseDTO toResponse(LoyaltyTransaction transaction) {
        if (transaction == null) {
            return null;
        }

        return LoyaltyTransactionResponseDTO.builder()
                .loyaltyTransactionId(transaction.getLoyaltyTransactionId())
                .customerId(transaction.getCustomerId())
                .paymentId(transaction.getPaymentId())
                .transactionType(transaction.getTransactionType())
                .points(transaction.getPoints())
                .balanceBefore(transaction.getBalanceBefore())
                .balanceAfter(transaction.getBalanceAfter())
                .expiredAt(transaction.getExpiredAt())
                .createdAt(transaction.getCreatedAt())
                .note(transaction.getNote())
                .build();
    }
}
