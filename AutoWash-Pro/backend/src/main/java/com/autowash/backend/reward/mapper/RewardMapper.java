package com.autowash.backend.reward.mapper;

import com.autowash.backend.reward.dto.RewardRequestDTO;
import com.autowash.backend.reward.dto.RewardResponseDTO;
import com.autowash.backend.reward.entity.Reward;
import org.springframework.stereotype.Component;

/**
 * Mapper chuyển đổi giữa {@link Reward} entity và các DTO liên quan.
 *
 * <p>Viết tay thay vì dùng MapStruct vì entity không có quan hệ lồng nhau
 * và số lượng field ít — giữ code đơn giản, dễ debug.</p>
 */
@Component
public class RewardMapper {

    /**
     * Chuyển {@link RewardRequestDTO} → {@link Reward} entity để INSERT mới.
     *
     * <p>Các field có default ({@code vehicleType}, {@code status}) sẽ được
     * gán fallback nếu client không gửi lên (null-safe).</p>
     *
     * @param dto dữ liệu nhận từ client
     * @return entity chưa có {@code rewardId} và {@code createdAt}
     *         (hai field này do DB/JPA tự sinh khi save)
     */
    public Reward toEntity(RewardRequestDTO dto) {
        return Reward.builder()
                .rewardName(dto.getRewardName())
                .requiredPoints(dto.getRequiredPoints())
                .rewardType(dto.getRewardType())
                .rewardValue(dto.getRewardValue())
                // Fallback về default nếu client không gửi vehicleType
                .vehicleType(dto.getVehicleType() != null
                        ? dto.getVehicleType()
                        : Reward.RewardVehicleType.car)
                // Fallback về default nếu client không gửi status
                .status(dto.getStatus() != null
                        ? dto.getStatus()
                        : Reward.RewardStatus.active)
                .build();
    }

    /**
     * Chuyển {@link Reward} entity → {@link RewardResponseDTO} để trả về client.
     *
     * @param reward entity đã được lưu vào DB (có đầy đủ rewardId, createdAt)
     * @return DTO chứa toàn bộ thông tin của reward
     */
    public RewardResponseDTO toResponse(Reward reward) {
        return RewardResponseDTO.builder()
                .rewardId(reward.getRewardId())
                .rewardName(reward.getRewardName())
                .requiredPoints(reward.getRequiredPoints())
                .rewardType(reward.getRewardType())
                .rewardValue(reward.getRewardValue())
                .vehicleType(reward.getVehicleType())
                .status(reward.getStatus())
                .createdAt(reward.getCreatedAt())
                .build();
    }

    /**
     * Patch entity từ DTO khi UPDATE — chỉ ghi đè những field client gửi lên (không null).
     *
     * <p>Không tạo entity mới mà mutate trực tiếp vào {@code reward} đang
     * được JPA quản lý trong Persistence Context, nhờ đó tránh mất
     * các field DB-managed như {@code createdAt}.</p>
     *
     * @param dto    dữ liệu cập nhật từ client (field null = giữ nguyên giá trị cũ)
     * @param reward entity đang tồn tại trong DB cần được cập nhật
     */
    public void updateEntityFromDto(RewardRequestDTO dto, Reward reward) {
        if (dto.getRewardName() != null)     reward.setRewardName(dto.getRewardName());
        if (dto.getRequiredPoints() != null) reward.setRequiredPoints(dto.getRequiredPoints());
        if (dto.getRewardType() != null)     reward.setRewardType(dto.getRewardType());
        if (dto.getRewardValue() != null)    reward.setRewardValue(dto.getRewardValue());
        if (dto.getVehicleType() != null)    reward.setVehicleType(dto.getVehicleType());
        if (dto.getStatus() != null)         reward.setStatus(dto.getStatus());
    }
}