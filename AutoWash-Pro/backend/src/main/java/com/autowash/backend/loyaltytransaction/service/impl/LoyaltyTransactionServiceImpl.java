package com.autowash.backend.loyaltytransaction.service.impl;

import com.autowash.backend.loyaltytransaction.dto.LoyaltyBalanceResponseDTO;
import com.autowash.backend.loyaltytransaction.dto.LoyaltyTransactionResponseDTO;
import com.autowash.backend.loyaltytransaction.entity.LoyaltyTransaction;
import com.autowash.backend.loyaltytransaction.mapper.LoyaltyTransactionMapper;
import com.autowash.backend.loyaltytransaction.repository.LoyaltyTransactionRepository;
import com.autowash.backend.loyaltytransaction.service.LoyaltyTransactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class LoyaltyTransactionServiceImpl implements LoyaltyTransactionService {

    private final LoyaltyTransactionRepository loyaltyTransactionRepository;
    private final LoyaltyTransactionMapper loyaltyTransactionMapper;

    @Override
    public List<LoyaltyTransactionResponseDTO> getCustomerTransactions(
            Integer customerId,
            String transactionType
    ) {
        List<LoyaltyTransaction> transactions;

        if (transactionType == null || transactionType.isBlank()) {
            transactions = loyaltyTransactionRepository
                    .findByCustomerIdOrderByCreatedAtDesc(customerId);
        } else {
            transactions = loyaltyTransactionRepository
                    .findByCustomerIdAndTransactionTypeOrderByCreatedAtDesc(
                            customerId,
                            transactionType
                    );
        }

        return transactions.stream()
                .map(loyaltyTransactionMapper::toResponse)
                .toList();
    }

    @Override
    public LoyaltyBalanceResponseDTO getCustomerBalance(Integer customerId) {
        return loyaltyTransactionRepository
                .findTopByCustomerIdOrderByCreatedAtDesc(customerId)
                .map(transaction -> LoyaltyBalanceResponseDTO.builder()
                        .customerId(customerId)
                        .currentPoints(transaction.getBalanceAfter())
                        .lastUpdatedAt(transaction.getCreatedAt())
                        .build())
                .orElseGet(() -> LoyaltyBalanceResponseDTO.builder()
                        .customerId(customerId)
                        .currentPoints(0)
                        .lastUpdatedAt(null)
                        .build());
    }
}
