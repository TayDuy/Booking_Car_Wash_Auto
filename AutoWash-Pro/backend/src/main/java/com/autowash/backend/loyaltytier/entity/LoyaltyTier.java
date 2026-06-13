package com.autowash.backend.loyaltytier.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "Loyalty_Tier")
public class LoyaltyTier {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "TierID")
    private Integer tierId;

    @Column(name = "TierName", nullable = false, length = 20)
    private String tierName;

    @Column(name = "MinPoints", nullable = false)
    private Integer minPoints;

    @Column(name = "MinVisits", nullable = false)
    private Integer minVisits;

    @Column(name = "MinSpending", nullable = false, precision = 12, scale = 2)
    private BigDecimal minSpending;

    @Column(name = "BookingWindowDays", nullable = false)
    private Integer bookingWindowDays;

    @Column(name = "PriorityLevel", nullable = false)
    private Integer priorityLevel;

    @Column(name = "BenefitDescription", length = 255)
    private String benefitDescription;

    @Column(name = "IsActive", nullable = false)
    private Boolean isActive;

    public LoyaltyTier() {
    }

    public LoyaltyTier(Integer tierId, String tierName, Integer minPoints, Integer minVisits,
                       BigDecimal minSpending, Integer bookingWindowDays,
                       Integer priorityLevel, String benefitDescription, Boolean isActive) {
        this.tierId = tierId;
        this.tierName = tierName;
        this.minPoints = minPoints;
        this.minVisits = minVisits;
        this.minSpending = minSpending;
        this.bookingWindowDays = bookingWindowDays;
        this.priorityLevel = priorityLevel;
        this.benefitDescription = benefitDescription;
        this.isActive = isActive;
    }

    public Integer getTierId() {
        return tierId;
    }

    public void setTierId(Integer tierId) {
        this.tierId = tierId;
    }

    public String getTierName() {
        return tierName;
    }

    public void setTierName(String tierName) {
        this.tierName = tierName;
    }

    public Integer getMinPoints() {
        return minPoints;
    }

    public void setMinPoints(Integer minPoints) {
        this.minPoints = minPoints;
    }

    public Integer getMinVisits() {
        return minVisits;
    }

    public void setMinVisits(Integer minVisits) {
        this.minVisits = minVisits;
    }

    public BigDecimal getMinSpending() {
        return minSpending;
    }

    public void setMinSpending(BigDecimal minSpending) {
        this.minSpending = minSpending;
    }

    public Integer getBookingWindowDays() {
        return bookingWindowDays;
    }

    public void setBookingWindowDays(Integer bookingWindowDays) {
        this.bookingWindowDays = bookingWindowDays;
    }

    public Integer getPriorityLevel() {
        return priorityLevel;
    }

    public void setPriorityLevel(Integer priorityLevel) {
        this.priorityLevel = priorityLevel;
    }

    public String getBenefitDescription() {
        return benefitDescription;
    }

    public void setBenefitDescription(String benefitDescription) {
        this.benefitDescription = benefitDescription;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean active) {
        isActive = active;
    }
}