package com.autowash.backend.servicepackage.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class ServicePackageRequest {

    @NotBlank(message = "Tên dịch vụ không được để trống")
    @Size(max = 100)
    private String serviceName;

    private String description;

    @NotNull(message = "Giá không được null")
    @DecimalMin(value = "0.0", inclusive = false, message = "Giá phải lớn hơn 0")
    private BigDecimal basePrice;

    @Min(value = 5, message = "Thời gian tối thiểu 5 phút")
    @Max(value = 480, message = "Thời gian tối đa 480 phút")
    private Integer durationMinutes;

    private Boolean isActive;
}
