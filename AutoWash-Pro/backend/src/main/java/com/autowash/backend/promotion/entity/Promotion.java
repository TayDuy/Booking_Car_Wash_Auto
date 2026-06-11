package com.autowash.backend.promotion.entity;

import com.autowash.backend.loyalty.entity.LoyaltyTier;
import com.autowash.backend.user.entity.User;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Chương trình khuyến mãi do admin tạo.
 * discount_type:
 *   percent      → giảm theo % trên tổng tiền
 *   fixed        → giảm số tiền cố định (VND)
 *   free_service → miễn phí 1 dịch vụ
 * target_tier_id nullable → null = áp dụng cho tất cả hạng.
 * usage_limit    nullable → null = không giới hạn số lần dùng.
 */
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
     * Set khi muốn giới hạn promotion chỉ cho hạng Silver/Gold/Platinum.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_tier_id",
            foreignKey = @ForeignKey(name = "fk_promo_tier"))
    private LoyaltyTier targetTier;

    /**
     * Loại giảm giá:
     *   percent      → discountValue là % (VD: 10.0 = giảm 10%)
     *   fixed        → discountValue là số tiền VND (VD: 50000)
     *   free_service → discountValue là service_id được miễn phí
     */
    @NotNull(message = "Loại giảm giá không được null")
    @Column(name = "discount_type", nullable = false, length = 15)
    @Enumerated(EnumType.STRING)
    private DiscountType discountType;

    /** Giá trị giảm — ý nghĩa tùy discountType. */
    @NotNull(message = "Giá trị giảm không được null")
    @DecimalMin(value = "0.0", inclusive = false, message = "Giá trị giảm phải lớn hơn 0")
    @Digits(integer = 10, fraction = 2)
    @Column(name = "discount_value", nullable = false, precision = 12, scale = 2)
    private BigDecimal discountValue;

    @NotNull(message = "Ngày bắt đầu không được null")
    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @NotNull(message = "Ngày kết thúc không được null")
    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    /**
     * Nullable — null = không giới hạn số lần dùng toàn hệ thống.
     * Service cần kiểm tra usage_limit trước khi áp dụng promotion.
     */
    @Min(value = 1, message = "Usage limit tối thiểu là 1")
    @Column(name = "usage_limit")
    private Integer usageLimit;

    @NotNull(message = "Status không được null")
    @Column(name = "status", nullable = false, length = 10)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private PromotionStatus status = PromotionStatus.active;

    /** Admin tạo promotion — FK → account. */
    @NotNull(message = "CreatedBy không được null")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false,
            foreignKey = @ForeignKey(name = "fk_promo_creator"))
    private User createdBy;

    public enum DiscountType { percent, fixed, free_service }

    public enum PromotionStatus { active, inactive, expired }

    // ── Helpers ──────────────────────────────────────────────────────────────

    /** Promotion có đang trong thời hạn sử dụng không. */
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
}