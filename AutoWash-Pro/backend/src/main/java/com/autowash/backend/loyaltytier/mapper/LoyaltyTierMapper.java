package com.autowash.backend.loyaltytier.mapper;

import com.autowash.backend.customer.entity.Customer;
import com.autowash.backend.loyaltytier.dto.CustomerTierEvaluationResponseDTO;
import com.autowash.backend.loyaltytier.entity.LoyaltyTier;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

/**
 * Mapper cho module LoyaltyTier.
 *
 * Nhiệm vụ:
 * - Chuyển dữ liệu sau khi service đánh giá hạng thành ResponseDTO.
 * - Giúp ServiceImpl gọn hơn, không phải tự build DTO.
 *
 * Lưu ý:
 * - Mapper không xử lý business logic.
 * - Logic phân hạng vẫn nằm trong LoyaltyTierEvaluationServiceImpl.
 */
@Component
public class LoyaltyTierMapper {

    /**
     * Map kết quả đánh giá hạng thành CustomerTierEvaluationResponseDTO.
     *
     * @param customer customer được đánh giá
     * @param previousTierId tier cũ trước khi đánh giá
     * @param previousTierName tên tier cũ
     * @param matchedTier tier mới sau khi đánh giá
     * @param currentPoints điểm hiện tại
     * @param totalVisits tổng lượt ghé thăm
     * @param totalSpending tổng chi tiêu
     * @param message thông báo kết quả
     * @return DTO trả về cho controller
     */
    public CustomerTierEvaluationResponseDTO toEvaluationResponse(
            Customer customer,
            Integer previousTierId,
            String previousTierName,
            LoyaltyTier matchedTier,
            Integer currentPoints,
            Integer totalVisits,
            BigDecimal totalSpending,
            String message
    ) {
        return new CustomerTierEvaluationResponseDTO(
                customer.getCustomerId(),
                previousTierId,
                previousTierName,
                matchedTier.getTierId(),
                matchedTier.getTierName(),
                currentPoints,
                totalVisits,
                totalSpending,
                message
        );
    }
}