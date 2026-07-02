package com.autowash.backend.customerreward.entity;

import com.autowash.backend.customer.entity.Customer;
import com.autowash.backend.reward.entity.Reward;
import jakarta.persistence.*;
import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Builder
public class CustomerReward {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "customer_reward_id")
    private Integer customerRewardId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id, nullable = false")
    private Customer customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reward_id, nullable = false")
    private Reward reward;

    @Column(name = "voucher_code", nullable = false, unique = true, length = 50)
    private String voucherCode;

    @Builder.Default
    @Column(name = "status", nullable = false, length = 20)
    private String status = "UNUSED";

    @Column(name = "redeemed_points", nullable = false)
    private Integer redeemPoints;

    @Column(name = "discount_type", length = 30)
    private String discountType;

    @Column(name = "discount_value", precision = 12, scale = 2)
    private BigDecimal discountValue;

    @Builder.Default
    @Column(name = "redeemed_at", nullable = false)
    private LocalDateTime redeemAt = LocalDateTime.now();

    @Column(name = "expired_at")
    private LocalDateTime expiredAt;

    @Column(name = "used_at")
    private LocalDateTime useAt;

    @Column(name = "used_booking_id")
    private Integer useBookingId;
}
