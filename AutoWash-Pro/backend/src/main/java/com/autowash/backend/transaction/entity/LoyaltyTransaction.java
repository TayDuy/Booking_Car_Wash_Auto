package com.autowash.backend.transaction.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "loyalty_transaction")
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

    public LoyaltyTransaction(){
    }

    public LoyaltyTransaction(Long loyaltyTransactionId, Long customerId, Long paymentId, String transactionType, Integer points, Integer balanceBefore, Integer balanceAfter, LocalDateTime expiredAt, LocalDateTime createdAt, String note) {
        this.loyaltyTransactionId = loyaltyTransactionId;
        this.customerId = customerId;
        this.paymentId = paymentId;
        this.transactionType = transactionType;
        this.points = points;
        this.balanceBefore = balanceBefore;
        this.balanceAfter = balanceAfter;
        this.expiredAt = expiredAt;
        this.createdAt = createdAt;
        this.note = note;
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
