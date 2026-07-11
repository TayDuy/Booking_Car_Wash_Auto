package com.autowash.backend.customerreward.mapper;

import com.autowash.backend.customerreward.dto.CustomerRewardResponseDTO;
import com.autowash.backend.customerreward.entity.CustomerReward;
import org.springframework.stereotype.Component;

@Component
public class CustomerRewardMapper {

    public CustomerRewardResponseDTO toResponse(
            CustomerReward customerReward,
            Integer remainingPoints
    ) {
        return CustomerRewardResponseDTO.builder()
                .customerRewardId(customerReward.getCustomerRewardId())
                .customerId(customerReward.getCustomer().getCustomerId())
                .rewardId(customerReward.getReward().getRewardId())
                .rewardName(customerReward.getReward().getRewardName())
                .voucherCode(customerReward.getVoucherCode())
                .status(customerReward.getStatus())
                .redeemedPoints(customerReward.getRedeemedPoints())
                .remainingPoints(remainingPoints)
                .discountType(customerReward.getDiscountType())
                .discountValue(customerReward.getDiscountValue())
                .redeemedAt(customerReward.getRedeemedAt())
                .expiredAt(customerReward.getExpiredAt())
                .usedAt(customerReward.getUsedAt())
                .usedBookingId(customerReward.getUsedBookingId())
                .build();
    }
}