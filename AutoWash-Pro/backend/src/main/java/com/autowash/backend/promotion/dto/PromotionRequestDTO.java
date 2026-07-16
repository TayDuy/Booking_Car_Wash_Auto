package com.autowash.backend.promotion.dto;

import com.autowash.backend.promotion.entity.Promotion.DiscountType;
import com.autowash.backend.promotion.entity.Promotion.VehicleType;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import com.autowash.backend.promotion.entity.Promotion.PromotionStatus;

/**
 * DTO dùng để nhận dữ liệu từ client khi tạo mới hoặc cập nhật một Promotion.
 * Các constraint validation được khai báo ở đây thay vì lặp lại ở entity.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PromotionRequestDTO {

    /** Tên chương trình khuyến mãi, bắt buộc, tối đa 100 ký tự. */
    @NotBlank(message = "Tên khuyến mãi không được để trống")
    @Size(max = 100, message = "Tên khuyến mãi tối đa 100 ký tự")
    private String promotionName;

    /**
     * ID của hạng thành viên được áp dụng khuyến mãi.
     * Để null nếu muốn áp dụng cho tất cả hạng thành viên.
     */
    private Integer targetTierId;

    /**
     * Loại xe được áp dụng khuyến mãi: sedan, suv, truck, minivan.
     * Để null nếu muốn áp dụng cho tất cả loại xe.
     */
    private VehicleType vehicleType;

    /**
     * Loại giảm giá:
     *   percent      → giảm theo % trên tổng đơn hàng
     *   fixed        → giảm số tiền cố định
     *   free_service → miễn phí toàn bộ dịch vụ
     */

    private PromotionStatus status;
    @NotNull(message = "Loại giảm giá không được null")
    private DiscountType discountType;

    /** Giá trị giảm tương ứng với discountType (phải > 0). */
    @NotNull(message = "Giá trị giảm không được null")
    @DecimalMin(value = "0.0", inclusive = false, message = "Giá trị giảm phải > 0")
    @Digits(integer = 10, fraction = 2)
    private BigDecimal discountValue;

    /**
     * Giá trị đơn hàng tối thiểu để được áp dụng khuyến mãi.
     * Để null nếu không yêu cầu điều kiện giá trị tối thiểu.
     */
    @DecimalMin(value = "0.0", inclusive = false, message = "Giá trị đơn tối thiểu phải > 0")
    @Digits(integer = 10, fraction = 2)
    private BigDecimal minOrderValue;

    /** Ngày bắt đầu hiệu lực của khuyến mãi. */
    @NotNull(message = "Ngày bắt đầu không được null")
    private LocalDate startDate;

    /** Ngày kết thúc hiệu lực của khuyến mãi. Phải sau hoặc bằng startDate. */
    @NotNull(message = "Ngày kết thúc không được null")
    private LocalDate endDate;

    /**
     * Giới hạn tổng số lượt sử dụng của promotion.
     * Để null nếu không giới hạn số lần dùng.
     */
    @Min(value = 1, message = "Usage limit tối thiểu là 1")
    private Integer usageLimit;
}