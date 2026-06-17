package com.autowash.backend.notification.dto;

import lombok.*;

/**
 * Response trả về số thông báo chưa đọc của user.
 * Client dùng để hiển thị badge số trên icon thông báo.
 */
@Getter
@AllArgsConstructor
public class UnreadCountResponseDTO {

    /** ID user đang được đếm. */
    private Integer userId;

    /** Số thông báo chưa đọc. */
    private Long unreadCount;
}