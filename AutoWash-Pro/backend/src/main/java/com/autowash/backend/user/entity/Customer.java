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
    @Column(name = "customerid")
    private Integer customerId;

    @Column(name = "userid", nullable = false)
    private Integer userId;

    @Column(name = "brandid")
    private Integer brandId;

    @Column(name = "fullname", nullable = false, length = 100)
    private String fullName;

    @Column(name = "dateofbirth")
    private LocalDate dateOfBirth;

    @Column(name = "gender", length = 10)
    private String gender;

    @Column(name = "tierid", nullable = false, insertable = false, updatable = false)
    private Integer tierId;

    @Column(name = "totalpoints", nullable = false, insertable = false, updatable = false)
    private Integer totalPoints;

    @Column(name = "totalvisits", nullable = false, insertable = false, updatable = false)
    private Integer totalVisits;

    @Column(name = "totalspending", nullable = false, insertable = false, updatable = false)
    private java.math.BigDecimal totalSpending;

    @Column(name = "joinedat", nullable = false, insertable = false, updatable = false)
    private java.time.LocalDateTime joinedAt;
}
