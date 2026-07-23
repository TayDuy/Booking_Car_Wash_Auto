package com.autowash.backend.reward.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;

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

    @Min(value = 1, message = "Required points tối thiểu là 1")
    @Column(name = "required_points", nullable = false)
    private Integer requiredPoints;

    @NotNull(message = "Loại reward không được null")
    @Column(name = "reward_type", nullable = false, length = 15)
    @Enumerated(EnumType.STRING)
    private RewardType rewardType;

    @NotNull(message = "Giá trị reward không được null")
    @DecimalMin(value = "0.0", inclusive = false, message = "Giá trị reward phải lớn hơn 0")
    @Digits(integer = 10, fraction = 2)
    @Column(name = "reward_value", nullable = false, precision = 12, scale = 2)
    private BigDecimal rewardValue;

    @NotNull(message = "Vehicle type không được null")
    @Convert(converter = RewardVehicleTypeConverter.class)
    @Column(name = "vehicle_type", nullable = false, length = 10)
    @Builder.Default
    private RewardVehicleType vehicleType = RewardVehicleType.BOTH;

    @NotNull(message = "Status không được null")
    @Column(name = "status", nullable = false, length = 10)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private RewardStatus status = RewardStatus.active;

    @Column(name = "required_tier_level")
    private Integer requiredTierLevel;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public enum RewardType { discount, free_wash, addon }

    public enum RewardVehicleType {
        FOUR_SEATS("4 chỗ"),
        SEVEN_SEATS("7 chỗ"),
        BOTH("both");

        private final String value;

        RewardVehicleType(String value) {
            this.value = value;
        }

        @com.fasterxml.jackson.annotation.JsonValue
        public String getValue() {
            return value;
        }

        @com.fasterxml.jackson.annotation.JsonCreator
        public static RewardVehicleType fromValue(String raw) {
            if (raw == null) return null;
            String v = raw.trim().toLowerCase();
            return switch (v) {
                case "car", "sedan", "4 chỗ", "4_seats", "4-seats", "four_seats" -> FOUR_SEATS;
                case "suv", "truck", "7 chỗ", "7_seats", "7-seats", "seven_seats" -> SEVEN_SEATS;
                case "both", "all" -> BOTH;
                default -> throw new IllegalArgumentException("Không hỗ trợ loại xe: " + raw);
            };
        }
    }

    public enum RewardStatus { active, inactive }

    public boolean isWelcomeReward() {
        return this.requiredTierLevel != null
                && this.requiredPoints != null
                && this.requiredPoints <= 1;
    }

    public boolean isRedeemableBy(Integer customerPoints) {
        return RewardStatus.active.equals(this.status)
                && customerPoints >= this.requiredPoints;
    }

    public boolean isApplicableForVehicleType(String vehicleType) {
        if (RewardVehicleType.BOTH.equals(this.vehicleType)) return true;
        if (vehicleType == null) return false;
        RewardVehicleType inputType = RewardVehicleType.fromValue(vehicleType);
        return this.vehicleType == inputType;
    }
}