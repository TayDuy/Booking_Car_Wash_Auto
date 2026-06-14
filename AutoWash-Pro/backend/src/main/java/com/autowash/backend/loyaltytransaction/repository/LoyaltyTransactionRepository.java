package com.autowash.backend.loyaltytransaction.repository;

import com.autowash.backend.loyaltytransaction.entity.LoyaltyTransaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface LoyaltyTransactionRepository extends JpaRepository<LoyaltyTransaction, Long> {

    List<LoyaltyTransaction> findByCustomerId(Long customerId);

    List<LoyaltyTransaction> findByCustomerIdAndTransactionType(Long customerId, String transactionType);

    List<LoyaltyTransaction> findByTransactionTypeAndExpiredAtBefore(String transactionType, LocalDateTime now);

    Optional<LoyaltyTransaction> findTopByCustomerIdOrderByCreatedAtDesc(Long customerId);
}