package com.autowash.backend.servicepackage.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DTO trả ra ngoài API — chỉ expose những field client cần.
 * Tách khỏi entity để tránh lộ thông tin nội bộ (audit fields, lazy relations...).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ServicePackageResponseDTO {

    private Integer serviceId;
    private String serviceName;
    private String description;
    private BigDecimal basePrice;
    private Integer durationMinutes;
    private Boolean isActive;

    /** Audit field — client dùng để hiển thị "Ngày tạo". */
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}