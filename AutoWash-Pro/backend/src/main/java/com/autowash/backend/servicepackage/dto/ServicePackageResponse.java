package com.autowash.backend.servicepackage.dto;

import jakarta.validation.constraints.*;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class ServicePackageResponse {

    private Integer serviceId;
    private String serviceName;
    private String description;
    private BigDecimal basePrice;
    private Integer durationMinutes;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

}
