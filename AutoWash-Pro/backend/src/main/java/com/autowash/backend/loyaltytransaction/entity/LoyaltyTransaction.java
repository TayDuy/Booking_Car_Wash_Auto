package com.autowash.backend.loyaltytransaction.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "loyalty_transaction")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoyaltyTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "loyalty_transaction_id")
    private Long loyaltyTransactionId;

    @Column(name = "customer_id", nullable = false)
    private Long customerId;

    @Column(name = "payment_id")
    private Long paymentId;

    @Column(name = "transaction_type", nullable = false)
    private String transactionType;

    @Column(name = "points", nullable = false)
    private Integer points;

    @Column(name = "balance_before", nullable = false)
    private Integer balanceBefore;

    @Column(name = "balance_after", nullable = false)
    private Integer balanceAfter;

    @Column(name = "expired_at")
    private LocalDateTime expiredAt;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "note")
    private String note;
}