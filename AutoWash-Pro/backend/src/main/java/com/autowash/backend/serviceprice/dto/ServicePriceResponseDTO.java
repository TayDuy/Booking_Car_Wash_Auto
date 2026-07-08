package com.autowash.backend.serviceprice.dto;

import lombok.*;
import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ServicePriceResponseDTO {
    private Integer servicePriceId;
    private String vehicleType;
    private BigDecimal price;
    private Boolean isActive;
}
