package com.autowash.backend.serviceprice.repository;

import com.autowash.backend.serviceprice.entity.ServicePrice;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ServicePriceRepository extends JpaRepository<ServicePrice, Integer> {

    Optional<ServicePrice> findByService_ServiceIdAndVehicleTypeAndIsActiveTrue(
            Integer serviceId,
            String vehicleType
    );
}
