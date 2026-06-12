package com.autowash.backend.promotion.entity;

import com.autowash.backend.loyalty.entity.LoyaltyTier;
import com.autowash.backend.user.entity.User;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "promotion")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@ToString(exclude = {"targetTier", "createdBy"})
public class Promotion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "promotion_id")
    @EqualsAndHashCode.Include
    private Integer promotionId;

    @NotBlank(message = "Tên khuyến mãi không được để trống")
    @Size(max = 100)
    @Column(name = "promotion_name", nullable = false, length = 100)
    private String promotionName;

    /**
     * Nullable — null = áp dụng cho tất cả hạng thành viên.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_tier_id",
            foreignKey = @ForeignKey(name = "fk_promo_tier"))
    private LoyaltyTier targetTier;

    /**
     * Loại xe áp dụng khuyến mãi.
     * Nullable — null = áp dụng cho tất cả loại xe.
     *   sedan      → xe con 4 chỗ / 5 chỗ thông thường
     *   suv        → xe gầm cao, 7 chỗ
     *   truck      → xe tải nhỏ / bán tải
     *   minivan    → xe gia đình 7–9 chỗ
     */
    @Column(name = "vehicle_type", length = 20)
    @Enumerated(EnumType.STRING)
    private VehicleType vehicleType;

    @NotNull(message = "Loại giảm giá không được null")
    @Column(name = "discount_type", nullable = false, length = 15)
    @Enumerated(EnumType.STRING)
    private DiscountType discountType;

    @NotNull(message = "Giá trị giảm không được null")
    @DecimalMin(value = "0.0", inclusive = false, message = "Giá trị giảm phải lớn hơn 0")
    @Digits(integer = 10, fraction = 2)
    @Column(name = "discount_value", nullable = false, precision = 12, scale = 2)
    private BigDecimal discountValue;

    /**
     * Áp dụng thêm điều kiện: giá trị đơn hàng tối thiểu để dùng promotion.
     * Nullable — null = không yêu cầu giá trị tối thiểu.
     */
    @DecimalMin(value = "0.0", inclusive = false)
    @Digits(integer = 10, fraction = 2)
    @Column(name = "min_order_value", precision = 12, scale = 2)
    private BigDecimal minOrderValue;

    @NotNull(message = "Ngày bắt đầu không được null")
    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @NotNull(message = "Ngày kết thúc không được null")
    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Min(value = 1, message = "Usage limit tối thiểu là 1")
    @Column(name = "usage_limit")
    private Integer usageLimit;

    @NotNull(message = "Status không được null")
    @Column(name = "status", nullable = false, length = 10)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private PromotionStatus status = PromotionStatus.active;

    @NotNull(message = "CreatedBy không được null")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false,
            foreignKey = @ForeignKey(name = "fk_promo_creator"))
    private User createdBy;

    public enum VehicleType { sedan, suv, truck, minivan }

    public enum DiscountType { percent, fixed, free_service }

    public enum PromotionStatus { active, inactive, expired }

    // ── Helpers ──────────────────────────────────────────────────────────────

    /** Promotion có đang trong thời hạn và active không. */
    public boolean isValid() {
        LocalDate today = LocalDate.now();
        return PromotionStatus.active.equals(this.status)
                && !today.isBefore(this.startDate)
                && !today.isAfter(this.endDate);
    }

    /** Promotion có áp dụng cho tier này không. */
    public boolean isApplicableForTier(Integer tierId) {
        return this.targetTier == null
                || this.targetTier.getTierId().equals(tierId);
    }

    /**
     * Promotion có áp dụng cho loại xe này không.
     * null vehicleType = áp dụng tất cả loại xe.
     */
    public boolean isApplicableForVehicle(VehicleType type) {
        return this.vehicleType == null
                || this.vehicleType.equals(type);
    }

    /**
     * Kiểm tra toàn bộ điều kiện: valid + tier + loại xe + giá trị đơn tối thiểu.
     */
    public boolean isApplicable(Integer tierId, VehicleType vehicleType, BigDecimal orderValue) {
        if (!isValid()) return false;
        if (!isApplicableForTier(tierId)) return false;
        if (!isApplicableForVehicle(vehicleType)) return false;
        if (this.minOrderValue != null && orderValue.compareTo(this.minOrderValue) < 0) return false;
        return true;
    }
}