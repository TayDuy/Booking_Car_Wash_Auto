package com.autowash.backend.reward.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * FR-7: Phần thưởng đổi điểm — khách dùng total_points để redeem.
 * reward_type:
 *   discount  → giảm giá theo rewardValue (VND hoặc %)
 *   free_wash → rửa xe miễn phí 1 lần
 *   addon     → dịch vụ thêm miễn phí (VD: hút bụi, đánh bóng)
 * vehicle_type: chỉ áp dụng cho ô tô (car).
 */
@Entity
@Table(name = "reward")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@ToString
public class Reward {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "reward_id")
    @EqualsAndHashCode.Include
    private Integer rewardId;

    @NotBlank(message = "Tên Reward không được để trống")
    @Size(max = 100)
    @Column(name = "reward_name", nullable = false, length = 100)
    private String rewardName;

    /**
     * FR-7: Số điểm cần để đổi reward này.
     * Service kiểm tra customer.totalPoints >= requiredPoints trước khi redeem.
     */
    @Min(value = 1, message = "Required points tối thiểu là 1")
    @Column(name = "required_points", nullable = false)
    private Integer requiredPoints;

    /**
     * Loại reward:
     *   discount  → giảm tiền trực tiếp vào payment
     *   free_wash → booking tiếp theo miễn phí hoàn toàn
     *   addon     → thêm dịch vụ phụ miễn phí vào booking
     */
    @NotNull(message = "Loại reward không được null")
    @Column(name = "reward_type", nullable = false, length = 15)
    @Enumerated(EnumType.STRING)
    private RewardType rewardType;

    /** Giá trị quy đổi — ý nghĩa tùy rewardType (VND hoặc %). */
    @NotNull(message = "Giá trị reward không được null")
    @DecimalMin(value = "0.0", inclusive = false, message = "Giá trị reward phải lớn hơn 0")
    @Digits(integer = 10, fraction = 2)
    @Column(name = "reward_value", nullable = false, precision = 12, scale = 2)
    private BigDecimal rewardValue;

    /**
     * Loại xe được áp dụng reward:
     *   car → chỉ ô tô (hiện tại hệ thống chỉ hỗ trợ ô tô)
     */
    @NotNull(message = "Vehicle type không được null")
    @Column(name = "vehicle_type", nullable = false, length = 10)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private RewardVehicleType vehicleType = RewardVehicleType.car;

    @NotNull(message = "Status không được null")
    @Column(name = "status", nullable = false, length = 10)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private RewardStatus status = RewardStatus.active;

    /**
     * Cấp hạng tối thiểu để thấy và đổi reward này.
     * null = mọi hạng đều thấy được.
     * priorityLevel: Member=1, Silver=2, Gold=3, Platinum=4.
     */
    @Column(name = "required_tier_level")
    private Integer requiredTierLevel;

    /** Audit — set tự động khi INSERT. */
    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public enum RewardType { discount, free_wash, addon }

    public enum RewardVehicleType { car }

    public enum RewardStatus { active, inactive }

    // ── Helpers ──────────────────────────────────────────────────────────────

    /** Khách có đủ điểm để đổi reward này không. */
    public boolean isRedeemableBy(Integer customerPoints) {
        return RewardStatus.active.equals(this.status)
                && customerPoints >= this.requiredPoints;
    }

    /** Reward có áp dụng cho loại xe này không (luôn true vì chỉ hỗ trợ car). */
    public boolean isApplicableForVehicleType(String vehicleType) {
        return RewardVehicleType.car.name().equals(vehicleType);
    }
}