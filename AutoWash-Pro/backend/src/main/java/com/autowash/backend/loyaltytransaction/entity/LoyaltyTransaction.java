package com.autowash.backend.loyaltytransaction.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "loyalty_transaction")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoyaltyTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long loyaltyTransactionId;

    private Integer customerId;

    private Long paymentId;

    private String transactionType;

    private Integer points;

    private Integer balanceBefore;

    private Integer balanceAfter;

    private LocalDateTime expiredAt;

    private LocalDateTime createdAt;

    private String note;
}