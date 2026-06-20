package com.autowash.backend.payment.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

/**
 * DTO nhận từ client khi khách hàng muốn đổi điểm lấy reward (FR-7).
 *
 * <p>Flow: khách chọn reward → gửi request này → service kiểm tra điểm
 * → trừ điểm → tạo loyalty_transaction(redeem) → gắn reward_id vào payment.</p>
 *
 * <p>Tất cả field đều {@code @NotNull} vì reward phải được gắn
 * vào một booking cụ thể trong cùng một giao dịch atomic.</p>
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RedeemRequestDTO {

    /**
     * ID của khách hàng thực hiện đổi điểm.
     *
     * <p>Service dùng ID này để:
     * <ul>
     *   <li>Load {@code Customer} từ DB</li>
     *   <li>Kiểm tra {@code customer.totalPoints >= reward.requiredPoints}</li>
     *   <li>Trừ điểm và lưu lại sau khi đổi thành công</li>
     * </ul>
     * </p>
     */
    @NotNull(message = "customerId không được null")
    private Integer customerId;

    /**
     * ID của reward muốn đổi.
     *
     * <p>Service dùng ID này để:
     * <ul>
     *   <li>Load {@code Reward} từ DB</li>
     *   <li>Kiểm tra {@code status = active}</li>
     *   <li>Lấy {@code requiredPoints} để trừ điểm</li>
     *   <li>Gắn {@code rewardId} vào {@code Payment}</li>
     * </ul>
     * </p>
     */
    @NotNull(message = "rewardId không được null")
    private Integer rewardId;

    /**
     * ID của booking mà reward sẽ được áp dụng vào.
     *
     * <p>Service dùng ID này để load {@code Payment} theo {@code bookingId},
     * sau đó gắn {@code rewardId} vào payment để hệ thống thanh toán
     * biết booking này được giảm giá / miễn phí.</p>
     *
     * <p>Bắt buộc phải có — reward trong hệ thống này luôn gắn
     * với một booking cụ thể, không hỗ trợ đổi điểm trước.</p>
     */
    @NotNull(message = "bookingId không được null")
    private Integer bookingId;
}