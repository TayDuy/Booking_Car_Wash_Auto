package com.autowash.backend.servicepackage.dto;

import jakarta.validation.constraints.*;
import lombok.*;
import java.math.BigDecimal;

/**
 * DTO nhận dữ liệu từ client khi CREATE hoặc UPDATE service package.
 * Validation được đặt ở đây để fail-fast trước khi vào service layer.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ServicePackageRequestDTO {

    @NotBlank(message = "Tên dịch vụ không được để trống")
    @Size(max = 100, message = "Tên dịch vụ tối đa 100 ký tự")
    private String serviceName;

    @Size(max = 255, message = "Mô tả tối đa 255 ký tự")
    private String description;

    @NotNull(message = "Giá không được null")
    @DecimalMin(value = "0.0", inclusive = false, message = "Giá phải lớn hơn 0")
    @Digits(integer = 10, fraction = 2, message = "Giá không hợp lệ")
    private BigDecimal basePrice;

    /**
     * Thời gian thực hiện dịch vụ (phút).
     * FR-4: dùng để tính end_time khi tìm slot trống.
     */
    @Min(value = 5, message = "Thời gian tối thiểu 5 phút")
    @Max(value = 480, message = "Thời gian tối đa 480 phút")
    private Integer durationMinutes;

    /** Cho phép admin ẩn/hiện dịch vụ mà không cần xóa. */
    private Boolean isActive;
}