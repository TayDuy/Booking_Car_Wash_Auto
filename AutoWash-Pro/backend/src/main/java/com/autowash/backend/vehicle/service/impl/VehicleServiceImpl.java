package com.autowash.backend.vehicle.service.impl;

import com.autowash.backend.booking.enums.BookingStatus;
import com.autowash.backend.booking.repository.BookingRepository;
import com.autowash.backend.customer.entity.Customer;
import com.autowash.backend.customer.repository.CustomerRepository;
import com.autowash.backend.vehicle.dto.VehicleRequest;
import com.autowash.backend.vehicle.dto.VehicleResponse;
import com.autowash.backend.vehicle.entity.Vehicle;
import com.autowash.backend.common.exception.BusinessException;
import com.autowash.backend.vehicle.repository.VehicleRepository;
import com.autowash.backend.vehicle.service.VehicleService;
import org.springframework.http.HttpStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class VehicleServiceImpl implements VehicleService {

    private final VehicleRepository vehicleRespository;
    private final CustomerRepository customerRepository;
    private final BookingRepository bookingRepository;

    @Override
    public List<VehicleResponse> getMyVehicles(Integer userId) {
        Customer customer = customerRepository.findByUser_Id(userId)
                .orElseThrow(() -> new BusinessException("Không tìm thấy khách hàng", HttpStatus.NOT_FOUND));
        return vehicleRespository.findByCustomer_CustomerId(customer.getCustomerId())
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }
    
    @Override
    public List<VehicleResponse> getAllVehicles() {
        return vehicleRespository.findAll()
            .stream()
            .map(this::mapToResponse)
            .toList();
    }

    @Override
    public VehicleResponse addVehicle(Integer userId, VehicleRequest request) {
        Customer customer = customerRepository.findByUser_Id(userId)
                .orElseThrow(() -> new BusinessException("Không tìm thấy khách hàng", HttpStatus.NOT_FOUND));
        String normalizedPlate = request.getLicensePlate().trim().toUpperCase();
        if (vehicleRespository.existsByLicensePlate(normalizedPlate)) {
            throw new BusinessException("Biển số xe này đã được đăng ký trong hệ thống");
        }
        Vehicle vehicle = Vehicle.builder()
                .customer(customer)
                .licensePlate(normalizedPlate)
                .brand(request.getBrand())
                .model(request.getModel())
                .vehicleType(request.getVehicleType())
                .color(request.getColor())
                .nickname(request.getNickname())
                .isActive(true)
                .build();
        return mapToResponse(vehicleRespository.save(vehicle));
    }

    @Override
    @Transactional
    public VehicleResponse updateVehicle(Integer userId, Integer vehicleId, VehicleRequest request) {
        Customer customer = customerRepository.findByUser_Id(userId)
                .orElseThrow(() -> new BusinessException("Không tìm thấy khách hàng", HttpStatus.NOT_FOUND));
        Vehicle vehicle = vehicleRespository.findByVehicleIdAndCustomer_CustomerId(vehicleId, customer.getCustomerId())
                .orElseThrow(() -> new BusinessException("Không tìm thấy xe của bạn", HttpStatus.NOT_FOUND));
        String normalizedPlate = request.getLicensePlate().trim().toUpperCase();
        // Kiểm tra nếu đổi biển số thì biển số mới có bị trùng không
        if (!vehicle.getLicensePlate().equals(normalizedPlate)
                && vehicleRespository.existsByLicensePlate(normalizedPlate)) {
            throw new BusinessException("Biển số xe mới đã bị trùng");
        }
        vehicle.setLicensePlate(normalizedPlate);
        vehicle.setBrand(request.getBrand());
        vehicle.setModel(request.getModel());
        vehicle.setVehicleType(request.getVehicleType());
        vehicle.setColor(request.getColor());
        vehicle.setNickname(request.getNickname());
        return mapToResponse(vehicleRespository.save(vehicle));
    }


    @Override
    @Transactional
    public void deleteVehicle(Integer userId, Integer vehicleId) {
        Customer customer = customerRepository.findByUser_Id(userId)
                .orElseThrow(() -> new BusinessException("Không tìm thấy khách hàng", HttpStatus.NOT_FOUND));
        Vehicle vehicle = vehicleRespository.findByVehicleIdAndCustomer_CustomerId(vehicleId, customer.getCustomerId())
                .orElseThrow(() -> new BusinessException("Không tìm thấy xe của bạn", HttpStatus.NOT_FOUND));
        List<BookingStatus> activeStatuses = List.of(
                BookingStatus.pending,
                BookingStatus.confirmed,
                BookingStatus.in_progress
        );
        if (bookingRepository.existsByVehicle_VehicleIdAndStatusIn(vehicleId, activeStatuses)) {
            throw new BusinessException("Không thể xóa xe đang có lịch đặt chưa hoàn thành");
        }
        vehicle.setIsActive(false);
        vehicleRespository.save(vehicle);
    }
    @Override
    @Transactional
    public VehicleResponse toggleActive(Integer userId, Integer vehicleId) {
        Customer customer = customerRepository.findByUser_Id(userId)
                .orElseThrow(() -> new BusinessException("Không tìm thấy khách hàng", HttpStatus.NOT_FOUND));
        Vehicle vehicle = vehicleRespository.findByVehicleIdAndCustomer_CustomerId(vehicleId, customer.getCustomerId())
                .orElseThrow(() -> new BusinessException("Không tìm thấy xe của bạn", HttpStatus.NOT_FOUND));

        if (vehicle.getIsActive()) {
            List<BookingStatus> activeStatuses = List.of(
                    BookingStatus.pending,
                    BookingStatus.confirmed,
                    BookingStatus.in_progress
            );
            if (bookingRepository.existsByVehicle_VehicleIdAndStatusIn(vehicleId, activeStatuses)) {
                throw new BusinessException("Không thể ngừng hoạt động xe đang có lịch đặt chưa hoàn thành");
            }
            vehicle.setIsActive(false);
        } else {
            vehicle.setIsActive(true);
        }
        return mapToResponse(vehicleRespository.save(vehicle));
    }

    private VehicleResponse mapToResponse(Vehicle vehicle) {
        return VehicleResponse.builder()
                .vehicleId(vehicle.getVehicleId())
                .customerId(vehicle.getCustomer() != null ? vehicle.getCustomer().getCustomerId() : null)
                .customerName(vehicle.getCustomer() != null ? vehicle.getCustomer().getFullName() : null)
                .licensePlate(vehicle.getLicensePlate())
                .brand(vehicle.getBrand())
                .model(vehicle.getModel())
                .vehicleType(vehicle.getVehicleType())
                .color(vehicle.getColor())
                .nickname(vehicle.getNickname())
                .isActive(vehicle.getIsActive())
                .build();
    }
}