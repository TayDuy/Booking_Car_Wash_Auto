package com.autowash.backend.serviceprice.service;

import java.math.BigDecimal;

public interface ServicePriceService {

    BigDecimal getActivePrice(Integer serviceId, String vehicleType);
}
