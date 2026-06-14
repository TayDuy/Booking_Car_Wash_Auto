package com.autowash.backend.promotion.dto;

import com.autowash.backend.promotion.entity.Promotion.DiscountType;
import com.autowash.backend.promotion.entity.Promotion.PromotionStatus;
import com.autowash.backend.promotion.entity.Promotion.VehicleType;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * DTO trả về thông tin Promotion cho client.
 * Bao gồm thông tin đầy đủ: tier, loại xe, giá trị giảm, trạng thái,
 * và field {@code valid} để client biết promotion có đang hiệu lực không.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PromotionResponseDTO {

    /** ID duy nhất của promotion. */
    private Integer promotionId;

    /** Tên chương trình khuyến mãi. */
    private String promotionName;

    /**
     * ID và tên hạng thành viên được áp dụng.
     * Cả hai đều null nếu promotion áp dụng cho mọi hạng.
     */
    private Integer targetTierId;
    private String targetTierName;

    /**
     * Loại xe áp dụng (sedan / suv / truck / minivan).
     * null = áp dụng cho tất cả loại xe.
     */
    private VehicleType vehicleType;

    /** Loại giảm giá: percent / fixed / free_service. */
    private DiscountType discountType;

    /** Giá trị giảm tương ứng với discountType. */
    private BigDecimal discountValue;

    /**
     * Giá trị đơn hàng tối thiểu để dùng promotion.
     * null = không có yêu cầu tối thiểu.
     */
    private BigDecimal minOrderValue;

    /** Ngày bắt đầu và kết thúc hiệu lực. */
    private LocalDate startDate;
    private LocalDate endDate;

    /**
     * Tổng số lượt được phép sử dụng.
     * null = không giới hạn.
     */
    private Integer usageLimit;

    /** Trạng thái hiện tại: active / inactive / expired. */
    private PromotionStatus status;

    /** Thông tin người tạo promotion. */
    private Integer createdById;
    private String createdByName;

    /**
     * Convenience field — tổng hợp từ {@code Promotion#isValid()}.
     * true nếu status = active VÀ ngày hiện tại nằm trong [startDate, endDate].
     */
    private boolean valid;
}