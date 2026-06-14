package com.autowash.backend.reward.dto;

public record RedeemRewardResponse(
        String message,
        Long customerId,
        Integer rewardId,
        String rewardName,
        Integer pointsUsed,
        Integer balanceBefore,
        Integer balanceAfter
) {
}
