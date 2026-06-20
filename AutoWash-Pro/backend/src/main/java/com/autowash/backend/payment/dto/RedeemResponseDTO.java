package com.autowash.backend.payment.dto;

import com.autowash.backend.reward.entity.Reward;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DTO trả về cho client sau khi đổi điểm thành công (FR-7).
 *
 * <p>Thiết kế theo kiểu "snapshot tại thời điểm giao dịch":
 * <ul>
 *   <li>Client hiển thị được điểm trước/sau ngay mà không cần gọi thêm API</li>
 *   <li>Mọi thông tin reward và payment được đính kèm để UI render kết quả</li>
 * </ul>
 * </p>
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RedeemResponseDTO {

    // ── Thông tin giao dịch điểm ─────────────────────────────────────────────

    /**
     * ID của bản ghi {@code loyalty_transaction} vừa được tạo (type = redeem).
     * Client có thể dùng để tra lịch sử giao dịch điểm.
     */
    private Long loyaltyTransactionId;

    /**
     * Số điểm đã trừ — luôn âm (VD: {@code -500}).
     * Âm để nhất quán với convention của loyalty_transaction.points trong DB.
     */
    private Integer pointsDeducted;

    /** Điểm của khách TRƯỚC khi đổi — để hiển thị so sánh trên UI. */
    private Integer balanceBefore;

    /**
     * Điểm của khách SAU khi đổi.
     * Công thức: {@code balanceAfter = balanceBefore - reward.requiredPoints}.
     */
    private Integer balanceAfter;

    /**
     * Thời điểm giao dịch được ghi nhận.
     *
     * <p>Lấy từ {@code savedTx.getCreatedAt()} — tức là timestamp do DB sinh ra —
     * thay vì {@code LocalDateTime.now()} để đảm bảo nhất quán giữa
     * response và bản ghi trong DB.</p>
     */
    private LocalDateTime redeemedAt;

    // ── Thông tin reward đã đổi ───────────────────────────────────────────────

    /** ID của reward đã đổi. */
    private Integer rewardId;

    /** Tên reward đã đổi — để hiển thị trên UI (VD: "Giảm 50.000 VND"). */
    private String rewardName;

    /**
     * Loại reward: {@code discount} / {@code free_wash} / {@code addon}.
     * Client dùng để render icon hoặc badge phù hợp.
     */
    private Reward.RewardType rewardType;

    /**
     * Giá trị reward được áp dụng (đơn vị VND hoặc %).
     * Dùng {@link BigDecimal} để tránh sai số dấu phẩy động khi hiển thị tiền.
     */
    private BigDecimal rewardValue;

    // ── Thông tin payment đã cập nhật ─────────────────────────────────────────

    /** ID của booking reward được áp dụng vào. */
    private Integer bookingId;

    /**
     * ID của payment đã được gắn {@code rewardId}.
     * Client có thể dùng để poll trạng thái thanh toán sau khi đổi.
     */
    private Integer paymentId;

    /**
     * Thông báo kết quả thân thiện hiển thị cho khách.
     *
     * <p>Nội dung thay đổi theo {@code rewardType}:
     * <ul>
     *   <li>{@code discount}  → "Đổi điểm thành công! Bạn được giảm X VND..."</li>
     *   <li>{@code free_wash} → "Đổi điểm thành công! Lần rửa xe này miễn phí."</li>
     *   <li>{@code addon}     → "Đổi điểm thành công! Dịch vụ bổ sung X VND miễn phí."</li>
     * </ul>
     * </p>
     */
    private String message;
}