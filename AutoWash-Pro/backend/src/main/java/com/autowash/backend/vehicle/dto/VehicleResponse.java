package com.autowash.backend.vehicle.dto;

import com.autowash.backend.vehicle.entity.Vehicle;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class VehicleResponse {

    private Integer vehicleId;
    private String licensePlate;
    private String brand;
    private String model;
    private Vehicle.VehicleType vehicleType;
    private String color;
    private String nickname;
    private Boolean isActive;
}
