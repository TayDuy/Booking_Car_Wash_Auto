package com.autowash.backend.loyaltytier.dto;

import lombok.*;

/**
 * DTO rút gọn cho danh sách tier — dùng để đổ vào dropdown chọn
 * "gửi thông báo theo hạng" ở trang Admin Notification.
 */
@Getter
@Builder
@AllArgsConstructor
public class LoyaltyTierSummaryDTO {
    private Integer tierId;
    private String tierName;
    private Integer priorityLevel;
}