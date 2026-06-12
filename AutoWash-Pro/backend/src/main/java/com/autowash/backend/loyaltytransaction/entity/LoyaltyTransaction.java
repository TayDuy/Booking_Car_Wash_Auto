package com.autowash.backend.loyaltytransaction.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "LoyaltyTransaction")
public class LoyaltyTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "LoyaltyTransactionID")
    private Long loyaltyTransactionId;

    @Column(name = "CustomerID", nullable = false)
    private Long customerId;

    @Column(name = "PaymentID")
    private Long paymentId;

    @Column(name = "TransactionType", nullable = false, length = 10)
    private String transactionType;

    @Column(name = "Points", nullable = false)
    private Integer points;

    @Column(name = "BalanceBefore", nullable = false)
    private Integer balanceBefore;

    @Column(name = "BalanceAfter", nullable = false)
    private Integer balanceAfter;

    @Column(name = "ExpiredAt")
    private LocalDateTime expiredAt;

    @Column(name = "CreatedAt", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "Note", length = 255)
    private String note;

    public LoyaltyTransaction() {
    }

    public LoyaltyTransaction(Long customerId, Long paymentId, String transactionType,
                              Integer points, Integer balanceBefore, Integer balanceAfter,
                              LocalDateTime expiredAt, String note) {
        this.customerId = customerId;
        this.paymentId = paymentId;
        this.transactionType = transactionType;
        this.points = points;
        this.balanceBefore = balanceBefore;
        this.balanceAfter = balanceAfter;
        this.expiredAt = expiredAt;
        this.createdAt = LocalDateTime.now();
        this.note = note;
    }

    @PrePersist
    public void prePersist() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
    }

    public Long getLoyaltyTransactionId() {
        return loyaltyTransactionId;
    }

    public void setLoyaltyTransactionId(Long loyaltyTransactionId) {
        this.loyaltyTransactionId = loyaltyTransactionId;
    }

    public Long getCustomerId() {
        return customerId;
    }

    public void setCustomerId(Long customerId) {
        this.customerId = customerId;
    }

    public Long getPaymentId() {
        return paymentId;
    }

    public void setPaymentId(Long paymentId) {
        this.paymentId = paymentId;
    }

    public String getTransactionType() {
        return transactionType;
    }

    public void setTransactionType(String transactionType) {
        this.transactionType = transactionType;
    }

    public Integer getPoints() {
        return points;
    }

    public void setPoints(Integer points) {
        this.points = points;
    }

    public Integer getBalanceBefore() {
        return balanceBefore;
    }

    public void setBalanceBefore(Integer balanceBefore) {
        this.balanceBefore = balanceBefore;
    }

    public Integer getBalanceAfter() {
        return balanceAfter;
    }

    public void setBalanceAfter(Integer balanceAfter) {
        this.balanceAfter = balanceAfter;
    }

    public LocalDateTime getExpiredAt() {
        return expiredAt;
    }

    public void setExpiredAt(LocalDateTime expiredAt) {
        this.expiredAt = expiredAt;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }
}