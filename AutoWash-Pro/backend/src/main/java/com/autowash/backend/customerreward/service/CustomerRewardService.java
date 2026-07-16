package com.autowash.backend.customerreward.service;

import com.autowash.backend.customerreward.dto.CustomerRewardResponseDTO;
import com.autowash.backend.customerreward.entity.CustomerReward;

import java.util.List;

public interface CustomerRewardService {

    CustomerRewardResponseDTO redeemReward(
            Integer customerId,
            Integer rewardId,
            Integer userId
    );

    List<CustomerRewardResponseDTO> getCustomerRewards(
            Integer customerId,
            Integer userId
    );

    CustomerRewardResponseDTO useReward(String voucherCode, Integer bookingId, Integer userId);
}
