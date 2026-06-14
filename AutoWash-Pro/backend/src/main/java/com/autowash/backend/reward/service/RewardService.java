package com.autowash.backend.reward.service;

import com.autowash.backend.loyaltytransaction.repository.LoyaltyTransactionRepository;
import com.autowash.backend.reward.dto.RewardResponse;
import com.autowash.backend.reward.entity.Reward;
import com.autowash.backend.reward.repository.RewardRepository;
import org.springframework.stereotype.Service;
import java.util.Arrays;
import java.util.List;

@Service // Danh dau day la xu ly nghiep vu
public class RewardService {

    private final RewardRepository rewardRepository; // do @Service : k can new moi 1 obj
    private final LoyaltyTransactionRepository loyaltyTransactionRepository;

    public RewardService(RewardRepository rewardRepository, LoyaltyTransactionRepository loyaltyTransactionRepository) {
        this.rewardRepository = rewardRepository;
        this.loyaltyTransactionRepository = loyaltyTransactionRepository;
    }

    public List<RewardResponse> getRedeemalableRewards(Long customerId, String vehicleTypeText) {
        Integer currentPoints = getCurrentPoints(customerId);


    }
}
