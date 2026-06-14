package com.autowash.backend.reward.dto;

import com.autowash.backend.reward.entity.Reward;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;

/**
 * DTO nhận dữ liệu từ client khi tạo mới hoặc cập nhật Reward.
 * Các annotation validation được giữ nguyên từ entity để đảm bảo
 * dữ liệu hợp lệ trước khi đưa vào service layer.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RewardRequestDTO {

    /** Tên hiển thị của reward, tối đa 100 ký tự, không được để trống. */
    @NotBlank(message = "Tên reward không được để trống")
    @Size(max = 100)
    private String rewardName;

    /**
     * Số điểm khách hàng cần tích lũy để đổi reward này.
     * Service sẽ kiểm tra customer.totalPoints >= requiredPoints trước khi redeem.
     */
    @NotNull
    @Min(value = 1, message = "Required points tối thiểu là 1")
    private Integer requiredPoints;

    /**
     * Phân loại reward:
     * <ul>
     *   <li>{@code discount}  – giảm tiền trực tiếp vào hóa đơn thanh toán</li>
     *   <li>{@code free_wash} – booking lần rửa xe tiếp theo miễn phí hoàn toàn</li>
     *   <li>{@code addon}     – thêm dịch vụ phụ miễn phí (hút bụi, đánh bóng…)</li>
     * </ul>
     */
    @NotNull(message = "Loại reward không được null")
    private Reward.RewardType rewardType;

    /**
     * Giá trị quy đổi của reward.
     * Ý nghĩa phụ thuộc vào {@code rewardType}:
     * <ul>
     *   <li>{@code discount}  – số tiền VND hoặc % được giảm</li>
     *   <li>{@code free_wash} – thường để 100 (100% miễn phí)</li>
     *   <li>{@code addon}     – giá trị dịch vụ phụ được tặng</li>
     * </ul>
     */
    @NotNull(message = "Giá trị reward không được null")
    @DecimalMin(value = "0.0", inclusive = false, message = "Giá trị reward phải lớn hơn 0")
    @Digits(integer = 10, fraction = 2)
    private BigDecimal rewardValue;

    /**
     * Loại xe áp dụng — hiện tại hệ thống chỉ hỗ trợ {@code car}.
     * Nếu client không gửi, mapper sẽ tự gán default là {@code car}.
     */
    private Reward.RewardVehicleType vehicleType;

    /**
     * Trạng thái reward: {@code active} hoặc {@code inactive}.
     * Nếu client không gửi, mapper sẽ tự gán default là {@code active}.
     */
    private Reward.RewardStatus status;
}