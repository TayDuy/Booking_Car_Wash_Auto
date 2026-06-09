package com.autowash.backend.user.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

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

    @Column(name = "user_id", nullable = false)
    private Integer userId;

    @Column(name = "brand_id")
    private Integer brandId;

    @Column(name = "full_name", nullable = false, length = 100)
    private String fullName;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Column(name = "gender", length = 10)
    private String gender;

    @Column(name = "tier_id", nullable = false, insertable = false, updatable = false)
    private Integer tierId;

    @Column(name = "total_points", nullable = false, insertable = false, updatable = false)
    private Integer totalPoints;

    @Column(name = "total_visits", nullable = false, insertable = false, updatable = false)
    private Integer totalVisits;

    @Column(name = "total_spending", nullable = false, insertable = false, updatable = false)
    private java.math.BigDecimal totalSpending;

    @Column(name = "joined_at", nullable = false, insertable = false, updatable = false)
    private java.time.LocalDateTime joinedAt;
}
