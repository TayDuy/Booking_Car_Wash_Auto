package com.autowash.backend.customer.entity;

import com.autowash.backend.loyaltytier.entity.LoyaltyTier;
import com.autowash.backend.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import static java.math.BigDecimal.ZERO;

@Entity
@Table(name = "customer")
@NoArgsConstructor
@AllArgsConstructor
@Data
@Builder
public class Customer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "customer_id")
    private Integer customerId;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "brand_id")
    private Integer brandId;

    @Column(name = "full_name", nullable = false, length = 100)
    private String fullName;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Column(name = "gender", length = 10)
    private String gender;

    @Column(name = "tier_id")
    private Integer tierId;

    @Column(name = "total_points", nullable = false)
    @Builder.Default
    private Integer totalPoints = 0;

    @Column(name = "total_visits", nullable = false)
    @Builder.Default
    private Integer totalVisits = 0;

    @Column(name = "total_spending", nullable = false)
    @Builder.Default
    private BigDecimal totalSpending = ZERO;

    @Column(name = "joined_at", nullable = false, insertable = false, updatable = false)
    private LocalDateTime joinedAt;

    @PrePersist
    protected void onCreate() {
        if (this.totalPoints == null) {
            this.totalPoints = 0;
        }
        if (this.totalVisits == null) {
            this.totalVisits = 0;
        }
        if (this.totalSpending == null) {
            this.totalSpending = ZERO;
        }
    }
}