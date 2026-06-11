package com.autowash.backend.vehicle.repository;

import com.autowash.backend.vehicle.entity.Vehicle;
import com.autowash.backend.vehicle.entity.Vehicle.VehicleType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VehicleRepository extends JpaRepository<Vehicle, Integer> {

    Optional<Vehicle> findByLicensePlate(String licensePlate);

    List<Vehicle> findByCustomer_CustomerIdAndIsActiveTrue(Integer customerId);

    List<Vehicle> findByCustomer_CustomerIdAndVehicleTypeAndIsActiveTrue(Integer customerId, VehicleType vehicleType);

    boolean existsByLicensePlate(String licensePlate);
}