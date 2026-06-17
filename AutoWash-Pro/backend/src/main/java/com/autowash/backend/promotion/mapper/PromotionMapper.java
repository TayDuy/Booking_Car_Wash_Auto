package com.autowash.backend.promotion.mapper;

import com.autowash.backend.loyaltytier.entity.LoyaltyTier;
import com.autowash.backend.promotion.dto.PromotionRequestDTO;
import com.autowash.backend.promotion.dto.PromotionResponseDTO;
import com.autowash.backend.promotion.entity.Promotion;
import com.autowash.backend.user.entity.User;
import org.springframework.stereotype.Component;

/**
 * Mapper chuyển đổi giữa entity {@link Promotion} và các DTO liên quan.
 * Tách biệt logic mapping ra khỏi service để dễ test và bảo trì.
 */
@Component
public class PromotionMapper {

    /**
     * Tạo entity {@link Promotion} mới từ DTO request.
     * Status mặc định sẽ là {@code active} (do {@code @Builder.Default} trong entity).
     *
     * @param dto       dữ liệu đầu vào từ client
     * @param tier      entity LoyaltyTier đã được resolve từ targetTierId (có thể null)
     * @param createdBy entity User đang thực hiện tạo promotion
     * @return Promotion entity chưa được persist
     */
    public Promotion toEntity(PromotionRequestDTO dto, LoyaltyTier tier, User createdBy) {
        return Promotion.builder()
                .promotionName(dto.getPromotionName())
                .targetTier(tier)                          // null = áp dụng tất cả tier
                .vehicleType(dto.getVehicleType())         // null = áp dụng tất cả loại xe
                .discountType(dto.getDiscountType())
                .discountValue(dto.getDiscountValue())
                .minOrderValue(dto.getMinOrderValue())     // null = không điều kiện tối thiểu
                .startDate(dto.getStartDate())
                .endDate(dto.getEndDate())
                .usageLimit(dto.getUsageLimit())           // null = không giới hạn lượt dùng
                .createdBy(createdBy)
                .build();
    }

    /**
     * Chuyển entity {@link Promotion} thành DTO để trả về cho client.
     * Flatten các quan hệ lazy (targetTier, createdBy) thành các field phẳng
     * để tránh LazyInitializationException khi serialize JSON.
     *
     * @param p entity Promotion đã load từ DB (cần eager/join fetch tier và createdBy)
     * @return DTO chứa đầy đủ thông tin hiển thị
     */
    public PromotionResponseDTO toDTO(Promotion p) {
        return PromotionResponseDTO.builder()
                .promotionId(p.getPromotionId())
                .promotionName(p.getPromotionName())
                // Flatten targetTier — null-safe
                .targetTierId(p.getTargetTier() != null ? p.getTargetTier().getTierId() : null)
                .targetTierName(p.getTargetTier() != null ? p.getTargetTier().getTierName() : null)
                .vehicleType(p.getVehicleType())
                .discountType(p.getDiscountType())
                .discountValue(p.getDiscountValue())
                .minOrderValue(p.getMinOrderValue())
                .startDate(p.getStartDate())
                .endDate(p.getEndDate())
                .usageLimit(p.getUsageLimit())
                .status(p.getStatus())
                // Flatten createdBy
                .createdById(p.getCreatedBy().getId())
                .createdByName(p.getCreatedBy().getUsername())
                // Tính valid tại thời điểm trả response
                .valid(p.isValid())
                .build();
    }

    /**
     * Cập nhật các field của entity hiện có từ DTO request (dùng cho PUT/PATCH).
     * Không thay đổi {@code promotionId}, {@code status}, và {@code createdBy}
     * để bảo toàn tính toàn vẹn dữ liệu.
     *
     * @param target entity Promotion cần cập nhật (đã load từ DB)
     * @param dto    dữ liệu mới từ client
     * @param tier   entity LoyaltyTier mới (có thể null)
     */
    public void updateEntity(Promotion target, PromotionRequestDTO dto, LoyaltyTier tier) {
        target.setPromotionName(dto.getPromotionName());
        target.setTargetTier(tier);
        target.setVehicleType(dto.getVehicleType());
        target.setDiscountType(dto.getDiscountType());
        target.setDiscountValue(dto.getDiscountValue());
        target.setMinOrderValue(dto.getMinOrderValue());
        target.setStartDate(dto.getStartDate());
        target.setEndDate(dto.getEndDate());
        target.setUsageLimit(dto.getUsageLimit());
        // Không cập nhật: promotionId, status, createdBy
    }
}