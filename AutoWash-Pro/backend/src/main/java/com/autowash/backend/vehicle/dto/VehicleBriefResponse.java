package com.autowash.backend.vehicle.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class VehicleBriefResponse {

    private Integer vehicleId;
    private String licensePlate;
    private String brand;
    private String model;
    private String vehicleType;
    private Boolean isActive;
}
