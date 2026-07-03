package com.autowash.backend.vehicle.service;

import com.autowash.backend.vehicle.dto.VehicleRequest;
import com.autowash.backend.vehicle.dto.VehicleResponse;

import java.util.List;

public interface VehicleService {
    List<VehicleResponse> getMyVehicles(Integer userId);

    List<VehicleResponse> getAllVehicles();
    
    VehicleResponse addVehicle(Integer userId, VehicleRequest request);
    VehicleResponse updateVehicle(Integer userId, Integer vehicleId, VehicleRequest request);
    void deleteVehicle(Integer userId, Integer vehicleId);
    VehicleResponse toggleActive(Integer userId, Integer vehicleId);
}
