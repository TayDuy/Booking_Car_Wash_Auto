package com.autowash.backend.servicepackage.dto;

import com.autowash.backend.serviceprice.dto.ServicePriceResponseDTO;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ServicePackageDetailResponseDTO {
    private Integer serviceId;
    private String serviceName;
    private String description;
    private BigDecimal basePrice;
    private Integer durationMinutes;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<ServicePriceResponseDTO> prices;
}
