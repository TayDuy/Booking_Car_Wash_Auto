package com.autowash.backend.customer.entity;

import com.autowash.backend.user.entity.User;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import static java.math.BigDecimal.ZERO;

/**
 * Thông tin khách hàng.
 *
 * Có hai loại:
 *
 * 1. Khách có tài khoản:
 *    - user khác null.
 *    - phone/email có thể lấy từ Customer hoặc Account.
 *
 * 2. Khách vãng lai:
 *    - user bằng null.
 *    - fullName và phone phải được lưu trực tiếp trong Customer.
 */
@Entity
@Table(name = "customer")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@ToString(exclude = "user")
public class Customer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "customer_id")
    @EqualsAndHashCode.Include
    private Integer customerId;

    /**
     * Nullable đối với khách vãng lai.
     *
     * Unique vẫn được giữ:
     * - Một account chỉ liên kết với một Customer.
     * - PostgreSQL vẫn cho phép nhiều bản ghi có user_id = null.
     */
    @OneToOne(fetch = FetchType.LAZY, optional = true)
    @JoinColumn(
            name = "user_id",
            unique = true,
            foreignKey = @ForeignKey(name = "fk_customer_account")
    )
    private User user;

    @Column(name = "brand_id")
    private Integer brandId;

    @Size(max = 100, message = "Tên khách hàng tối đa 100 ký tự")
    @Column(name = "full_name", nullable = false, length = 100)
    private String fullName;

    /**
     * Lưu trực tiếp số điện thoại của Customer.
     *
     * Với khách có account:
     * - Có thể đồng bộ từ account.phone.
     *
     * Với khách vãng lai:
     * - Đây là thông tin liên hệ chính.
     */
    @Size(max = 15, message = "Số điện thoại tối đa 15 ký tự")
    @Column(name = "phone", length = 15)
    private String phone;

    /**
     * Email không bắt buộc, đặc biệt với khách vãng lai.
     */
    @Email(message = "Email khách hàng không hợp lệ")
    @Size(max = 100, message = "Email tối đa 100 ký tự")
    @Column(name = "email", length = 100)
    private String email;

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

    @Column(
            name = "joined_at",
            nullable = false,
            insertable = false,
            updatable = false
    )
    private LocalDateTime joinedAt;

    // =========================================================
    // ENTITY CALLBACKS
    // =========================================================

    @PrePersist
    protected void onCreate() {
        normalizeContactInformation();

        if (totalPoints == null) {
            totalPoints = 0;
        }

        if (totalVisits == null) {
            totalVisits = 0;
        }

        if (totalSpending == null) {
            totalSpending = ZERO;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        normalizeContactInformation();
    }

    private void normalizeContactInformation() {
        if (fullName != null) {
            fullName = fullName.trim();
        }

        if (phone != null) {
            phone = phone.trim();

            if (phone.isBlank()) {
                phone = null;
            }
        }

        if (email != null) {
            email = email.trim().toLowerCase();

            if (email.isBlank()) {
                email = null;
            }
        }
    }

    // =========================================================
    // BUSINESS HELPERS
    // =========================================================

    /**
     * Customer không liên kết account là khách vãng lai.
     */
    public boolean isGuest() {
        return user == null;
    }

    /**
     * Ưu tiên số điện thoại lưu trong Customer.
     * Nếu chưa có thì lấy từ Account.
     */
    public String resolvePhone() {
        if (phone != null && !phone.isBlank()) {
            return phone;
        }

        return user != null
                ? user.getPhone()
                : null;
    }

    /**
     * Ưu tiên email lưu trong Customer.
     * Nếu chưa có thì lấy từ Account.
     */
    public String resolveEmail() {
        if (email != null && !email.isBlank()) {
            return email;
        }

        return user != null
                ? user.getEmail()
                : null;
    }

    /**
     * Khách vãng lai phải có tên và số điện thoại.
     */
    public boolean hasValidGuestInformation() {
        return !isGuest()
                || (fullName != null
                && !fullName.isBlank()
                && phone != null
                && !phone.isBlank());
    }
}