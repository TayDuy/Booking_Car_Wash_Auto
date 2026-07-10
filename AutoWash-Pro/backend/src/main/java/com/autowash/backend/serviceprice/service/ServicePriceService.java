package com.autowash.backend.serviceprice.service;

import com.autowash.backend.serviceprice.dto.ServicePriceResponseDTO;

import java.math.BigDecimal;
import java.util.List;

public interface ServicePriceService {

    BigDecimal getActivePrice(Integer serviceId, String vehicleType);

    List<ServicePriceResponseDTO> getPricesByService(Integer serviceId);
}
