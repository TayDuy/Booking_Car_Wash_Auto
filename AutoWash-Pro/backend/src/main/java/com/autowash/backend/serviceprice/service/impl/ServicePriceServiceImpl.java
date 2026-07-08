package com.autowash.backend.serviceprice.service.impl;

import com.autowash.backend.common.exception.BusinessException;
import com.autowash.backend.serviceprice.dto.ServicePriceResponseDTO;
import com.autowash.backend.serviceprice.entity.ServicePrice;
import com.autowash.backend.serviceprice.repository.ServicePriceRepository;
import com.autowash.backend.serviceprice.service.ServicePriceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ServicePriceServiceImpl implements ServicePriceService {

    private final ServicePriceRepository servicePriceRepository;

    @Override
    public BigDecimal getActivePrice(Integer serviceId, String vehicleType) {
        ServicePrice servicePrice = servicePriceRepository
                .findByService_ServiceIdAndVehicleTypeAndIsActiveTrue(serviceId, vehicleType)
                .orElseThrow(() -> new BusinessException(
                        "Chưa cấu hình giá cho dịch vụ này với loại xe: " + vehicleType,
                        HttpStatus.BAD_REQUEST
                ));

        return servicePrice.getPrice();
    }

    @Override
    public List<ServicePriceResponseDTO> getPricesByService(Integer serviceId) {
        return servicePriceRepository.findByService_ServiceIdAndIsActiveTrue(serviceId)
                .stream()
                .map(sp -> ServicePriceResponseDTO.builder()
                        .servicePriceId(sp.getServicePriceId())
                        .vehicleType(sp.getVehicleType())
                        .price(sp.getPrice())
                        .isActive(sp.getIsActive())
                        .build())
                .toList();
    }
}
