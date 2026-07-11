package com.autowash.backend.loyaltytransaction.service.impl;

import com.autowash.backend.booking.entity.Booking;
import com.autowash.backend.common.exception.ResourceNotFoundException;
import com.autowash.backend.customer.repository.CustomerRepository;
import com.autowash.backend.loyaltytransaction.dto.LoyaltyBalanceResponseDTO;
import com.autowash.backend.loyaltytransaction.dto.LoyaltyTransactionResponseDTO;
import com.autowash.backend.loyaltytransaction.entity.LoyaltyTransaction;
import com.autowash.backend.loyaltytransaction.mapper.LoyaltyTransactionMapper;
import com.autowash.backend.loyaltytransaction.repository.LoyaltyTransactionRepository;
import com.autowash.backend.loyaltytransaction.service.LoyaltyTransactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class LoyaltyTransactionServiceImpl implements LoyaltyTransactionService {

    private static final BigDecimal POINT_RATE = BigDecimal.valueOf(1000);

    private final LoyaltyTransactionRepository loyaltyTransactionRepository;
    private final LoyaltyTransactionMapper loyaltyTransactionMapper;
    private final CustomerRepository customerRepository;

    @Override
    public LoyaltyTransactionResponseDTO earnPointsFromCompleteBooking(
            Booking booking,
            BigDecimal bookingAmount
    ) {
        Integer customerId = booking.getCustomer().getCustomerId();

        Integer balanceBefore = loyaltyTransactionRepository
                .findTopByCustomerIdOrderByCreatedAtDesc(customerId)
                .map(LoyaltyTransaction::getBalanceAfter)
                .orElse(0);

        Integer earnedPoints = calculateEarnedPoints(bookingAmount);
        Integer balanceAfter = balanceBefore + earnedPoints;

        LoyaltyTransaction transaction = LoyaltyTransaction.builder()
                .customerId(customerId)
                .paymentId(null)
                .transactionType("earn")
                .points(earnedPoints)
                .balanceBefore(balanceBefore)
                .balanceAfter(balanceAfter)
                .expiredAt(LocalDateTime.now().plusYears(1))
                .createdAt(LocalDateTime.now())
                .note("Cộng điểm từ booking " + booking.getBookingCode())
                .build();

        return loyaltyTransactionMapper.toResponse(
                loyaltyTransactionRepository.save(transaction)
        );
    }

    private Integer calculateEarnedPoints(BigDecimal bookingAmount) {
        if (bookingAmount == null || bookingAmount.compareTo(BigDecimal.ZERO) <= 0) {
            return 0;
        }

        return bookingAmount
                .divide(POINT_RATE, 0, RoundingMode.DOWN)
                .intValue();
    }

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
    public List<LoyaltyTransactionResponseDTO> getMyTransactions(Integer userId, String transactionType) {
        Integer customerId = customerRepository.findByUser_Id(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer", "userId", userId))
                .getCustomerId();
        return getCustomerTransactions(customerId, transactionType);
    }

    @Override
    public LoyaltyBalanceResponseDTO getMyBalance(Integer userId) {
        Integer customerId = customerRepository.findByUser_Id(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer", "userId", userId))
                .getCustomerId();
        return getCustomerBalance(customerId);
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
