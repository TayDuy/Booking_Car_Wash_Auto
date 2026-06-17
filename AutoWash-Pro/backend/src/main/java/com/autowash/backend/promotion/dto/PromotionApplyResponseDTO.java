package com.autowash.backend.promotion.dto;

import lombok.*;
import java.math.BigDecimal;

/**
 * DTO trả về kết quả sau khi service kiểm tra và tính toán áp dụng promotion.
 * Client dùng {@code applicable} để biết có áp dụng được không,
 * sau đó dùng {@code discountAmount} và {@code finalAmount} để hiển thị.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PromotionApplyResponseDTO {

    /**
     * true  → promotion hợp lệ và thoả tất cả điều kiện của đơn hàng.
     * false → không áp dụng được (xem {@code message} để biết lý do).
     */
    private boolean applicable;

    /** Mô tả kết quả: thành công hoặc lý do không áp dụng được. */
    private String message;

    /**
     * Số tiền được giảm sau khi tính toán theo discountType.
     * Bằng 0 nếu {@code applicable = false}.
     */
    private BigDecimal discountAmount;

    /**
     * Giá trị đơn hàng sau khi đã trừ {@code discountAmount}.
     * Tối thiểu là 0 (không bao giờ âm).
     */
    private BigDecimal finalAmount;
}