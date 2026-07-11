package com.autowash.backend.reward.dto;

import com.autowash.backend.reward.entity.Reward;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DTO trả về cho client sau các thao tác GET / CREATE / UPDATE.
 * Bao gồm toàn bộ thông tin của Reward kèm metadata (rewardId, createdAt)
 * mà RequestDTO không có.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RewardResponseDTO {

    /** Primary key của reward trong DB. */
    private Integer rewardId;

    /** Tên hiển thị của reward. */
    private String rewardName;

    /** Số điểm cần để đổi reward này. */
    private Integer requiredPoints;

    /** Phân loại reward: discount / free_wash / addon. */
    private Reward.RewardType rewardType;

    /** Giá trị quy đổi (VND hoặc %) tùy theo rewardType. */
    private BigDecimal rewardValue;

    /** Loại xe được áp dụng — hiện tại chỉ có {@code car}. */
    private Reward.RewardVehicleType vehicleType;

    /** Trạng thái hiện tại: {@code active} hoặc {@code inactive}. */
    private Reward.RewardStatus status;

    private Integer requiredTierLevel;

    /** Thời điểm reward được tạo, set tự động bởi JPA Auditing khi INSERT. */
    private LocalDateTime createdAt;
}