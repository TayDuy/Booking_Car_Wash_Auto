package com.autowash.backend.promotion.dto;

import com.autowash.backend.promotion.entity.Promotion.VehicleType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.*;

import java.math.BigDecimal;

/**
 * DTO dùng khi client muốn kiểm tra hoặc áp dụng một promotion vào đơn hàng.
 * Service sẽ dùng các thông tin này để gọi {@code Promotion#isApplicable()}.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PromotionApplyRequestDTO {

    /** ID của promotion muốn áp dụng. */
    @NotNull
    private Integer promotionId;

    /** ID của customer đang áp dụng promotion. */
    @NotNull
    private Integer customerId;

    /** ID hạng thành viên của khách hàng đang đặt đơn. */
    @NotNull
    private Integer tierId;

    /** Loại xe của đơn hàng cần rửa. */
    @NotNull
    private VehicleType vehicleType;

    /** Tổng giá trị đơn hàng trước khi áp dụng khuyến mãi (phải > 0). */
    @NotNull
    @Positive
    private BigDecimal orderValue;


}