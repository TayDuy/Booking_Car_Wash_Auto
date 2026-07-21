package com.autowash.backend.vehicle.repository;

import com.autowash.backend.vehicle.entity.Vehicle;
import com.autowash.backend.vehicle.entity.Vehicle.VehicleType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VehicleRepository extends JpaRepository<Vehicle, Integer> {

    /**
     * Admin - danh sách toàn bộ vehicle kèm Customer (JOIN FETCH).
     *
     * Tránh N+1: findAll() rồi map sang DTO đọc vehicle.getCustomer()
     * (lazy @ManyToOne) sẽ bắn thêm 1 query cho MỖI xe. JOIN FETCH gộp
     * lại thành 1 query duy nhất.
     */
    @Query("""
            SELECT v FROM Vehicle v
            LEFT JOIN FETCH v.customer
            ORDER BY v.vehicleId DESC
            """)
    List<Vehicle> findAllWithCustomer();

    Optional<Vehicle> findByLicensePlate(String licensePlate);

    List<Vehicle> findByCustomer_CustomerIdAndIsActiveTrue(Integer customerId);

    List<Vehicle> findByCustomer_CustomerId(Integer customerId);

    List<Vehicle> findByCustomer_CustomerIdAndVehicleTypeAndIsActiveTrue(Integer customerId, VehicleType vehicleType);

    boolean existsByLicensePlate(String licensePlate);

    List<Vehicle> findByCustomer_CustomerIdIn(List<Integer> customerIds);

    //Dùng cho FR2: Tìm đúng xe của đúng khách đó (để khách này không tự ý sửa/xóa xe của khách khác)
    Optional<Vehicle> findByVehicleIdAndCustomer_CustomerId(Integer vehicleId, Integer customerId);

    Optional<Vehicle> findByLicensePlateAndCustomer_CustomerId(String licensePlate, Integer customerId);
}