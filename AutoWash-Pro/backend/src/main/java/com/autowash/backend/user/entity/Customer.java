package com.autowash.backend.user.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "Customer")
@NoArgsConstructor
@AllArgsConstructor
@Data
@Builder
public class Customer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "CustomerID")
    private Integer customerId;

    @Column(name = "UserID", nullable = false)
    private Integer userId;

    @Column(name = "BrandID")
    private Integer brandId;

    @Column(name = "FullName", nullable = false, length = 100)
    private String fullName;

    @Column(name = "DateOfBirth")
    private LocalDate dateOfBirth;

    @Column(name = "Gender", length = 10)
    private String gender;

    @Column(name = "TierID", nullable = false, insertable = false, updatable = false)
    private Integer tierId;

    @Column(name = "TotalPoints", nullable = false, insertable = false, updatable = false)
    private Integer totalPoints;

    @Column(name = "TotalVisits", nullable = false, insertable = false, updatable = false)
    private Integer totalVisits;

    @Column(name = "TotalSpending", nullable = false, insertable = false, updatable = false)
    private java.math.BigDecimal totalSpending;

    @Column(name = "JoinedAt", nullable = false, insertable = false, updatable = false)
    private java.time.LocalDateTime joinedAt;
}
