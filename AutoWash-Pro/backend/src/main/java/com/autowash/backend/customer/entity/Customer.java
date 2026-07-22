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

    // TODO: rename to branchId and add @ManyToOne(Branch) — column name in DB is brand_id
    // but it stores the branch (chi nhánh) the customer belongs to
    @Column(name = "brand_id")
    private Integer brandId;

    @Transient
    public Integer getBranchId() {
        return brandId;
    }

    @Transient
    public void setBranchId(Integer branchId) {
        this.brandId = branchId;
    }

    @Column(name = "full_name", nullable = false, length = 100)
    private String fullName;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Column(name = "gender", length = 10)
    private String gender;

    @Column(name = "phone", length = 15)
    private String phone;

    @Column(name = "email", length = 100)
    private String email;

    @Column(name = "tier_id")
    private Integer tierId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tier_id", insertable = false, updatable = false)
    private LoyaltyTier tier;

    @Column(name = "allow_data_sharing")
    @Builder.Default
    private Boolean allowDataSharing = false;

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

    public String resolvePhone() {
        if (phone != null && !phone.isBlank()) return phone;
        return user != null ? user.getPhone() : null;
    }

    public String resolveEmail() {
        if (email != null && !email.isBlank()) return email;
        return user != null ? user.getEmail() : null;
    }

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