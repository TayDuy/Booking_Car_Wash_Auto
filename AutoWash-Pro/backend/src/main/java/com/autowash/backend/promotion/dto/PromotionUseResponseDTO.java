package com.autowash.backend.promotion.dto;

import com.autowash.backend.promotion.entity.PromotionUse;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DTO trả về lịch sử sử dụng promotion.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PromotionUseResponseDTO {

    private Integer promotionUseId;

    private Integer promotionId;

    private Integer customerId;

    private BigDecimal orderValue;

    private BigDecimal discountAmount;

    private BigDecimal finalAmount;

    private PromotionUse.PromotionUseStatus status;

    private LocalDateTime usedAt;
}
