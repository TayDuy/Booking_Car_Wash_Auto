package com.autowash.backend.loyaltytier.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "loyalty_tier")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoyaltyTier {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "tier_id")
    private Integer tierId;

    @Column(name = "tier_name", nullable = false, length = 50)
    private String tierName;

    @Column(name = "min_points")
    private Integer minPoints;

    @Column(name = "min_visits")
    private Integer minVisits;

    @Column(name = "min_spending", nullable = false, precision = 12, scale = 2)
    private BigDecimal minSpending;

    @Column(name = "booking_window_days")
    private Integer bookingWindowDays;

    @Column(name = "priority_level")
    private Integer priorityLevel;

    @Column(name = "benefit_description", length = 500)
    private String benefitDescription;

    @Column(name = "is_active")
    private Boolean isActive;
}