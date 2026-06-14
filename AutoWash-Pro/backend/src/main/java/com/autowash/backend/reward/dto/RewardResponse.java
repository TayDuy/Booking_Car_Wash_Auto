package com.autowash.backend.reward.dto;

public record RewardResponse(
    Integer rewardId,
    String rewardName,
    Integer requiredPoints,
    String rewardType,
    String vehicleType,
    String status
) {
}
/*
    - <Record> là kiểu class ngắn gọn thay vì phải viết như PRO hay Lab211
*/