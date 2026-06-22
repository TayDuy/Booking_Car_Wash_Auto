package com.autowash.backend.reward.dto;

public record RedeemRewardResponseDTO(
        String message,
        Integer customerId,
        Integer rewardId,
        String rewardName,
        Integer pointsUsed,
        Integer balanceBefore,
        Integer balanceAfter
) {
}
