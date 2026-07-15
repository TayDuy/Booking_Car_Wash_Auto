package com.autowash.backend.notification.dto;

import lombok.*;

/**
 * Response sau khi admin gửi bulk notification.
 * Trả về số lượng và tiêu đề để admin xác nhận kết quả.
 */
@Getter
@AllArgsConstructor
@Builder
public class BulkNotificationResponseDTO {

    /** Tổng số user đã nhận được thông báo. */
    private Integer totalSent;

    /** Tiêu đề thông báo đã gửi — để admin confirm. */
    private String title;

    /**
     * Mô tả nhóm đối tượng đã gửi, ví dụ "Gold trở lên" hoặc "Tất cả khách hàng active".
     * Chỉ để hiển thị cho admin, không dùng để xử lý logic.
     */
    private String targetDescription;
}