package com.autowash.backend.vehicle.service.impl;

import com.autowash.backend.booking.enums.BookingStatus;
import com.autowash.backend.booking.repository.BookingRepository;
import com.autowash.backend.customer.entity.Customer;
import com.autowash.backend.customer.repository.CustomerRepository;
import com.autowash.backend.common.exception.BusinessException;
import com.autowash.backend.vehicle.dto.VehicleRequest;
import com.autowash.backend.vehicle.dto.VehicleResponse;
import com.autowash.backend.vehicle.entity.Vehicle;
import com.autowash.backend.vehicle.repository.VehicleRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class VehicleServiceImplTest {

    @Mock
    private VehicleRepository vehicleRepository;

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private BookingRepository bookingRepository;

    @InjectMocks
    private VehicleServiceImpl vehicleService;

    @Test
    void testGetMyVehiclesSuccess() {
        Customer customer = Customer.builder()
                .customerId(10)
                .fullName("Test Customer")
                .build();

        Vehicle vehicle = Vehicle.builder()
                .vehicleId(1)
                .customer(customer)
                .licensePlate("51A-999.99")
                .brand("Honda")
                .model("Civic")
                .vehicleType(Vehicle.VehicleType.car)
                .isActive(true)
                .build();

        when(customerRepository.findByUser_Id(1)).thenReturn(Optional.of(customer));
        when(vehicleRepository.findByCustomer_CustomerId(10)).thenReturn(List.of(vehicle));

        List<VehicleResponse> responses = vehicleService.getMyVehicles(1);

        assertNotNull(responses);
        assertEquals(1, responses.size());
        assertEquals("51A-999.99", responses.get(0).getLicensePlate());
        assertEquals("Honda", responses.get(0).getBrand());
    }

    @Test
    void testGetAllVehiclesSuccess() {
        Customer customer = Customer.builder()
                .customerId(10)
                .fullName("Test Customer")
                .build();

        Vehicle vehicle = Vehicle.builder()
                .vehicleId(1)
                .customer(customer)
                .licensePlate("51A-999.99")
                .brand("Honda")
                .model("Civic")
                .vehicleType(Vehicle.VehicleType.car)
                .isActive(true)
                .build();

        when(vehicleRepository.findAllWithCustomer()).thenReturn(List.of(vehicle));

        List<VehicleResponse> responses = vehicleService.getAllVehicles();

        assertNotNull(responses);
        assertEquals(1, responses.size());
        assertEquals("51A-999.99", responses.get(0).getLicensePlate());
    }

    @Test
    void testAddVehicleSuccess() {
        Customer customer = Customer.builder()
                .customerId(10)
                .fullName("Test Customer")
                .build();

        VehicleRequest request = new VehicleRequest();
        request.setLicensePlate("51A-999.99");
        request.setBrand("Honda");
        request.setModel("Civic");
        request.setVehicleType(Vehicle.VehicleType.car);
        request.setCustomerId(10);

        when(customerRepository.findByUser_Id(1)).thenReturn(Optional.of(customer));
        when(vehicleRepository.existsByLicensePlate(anyString())).thenReturn(false);
        
        Vehicle savedVehicle = Vehicle.builder()
                .vehicleId(1)
                .customer(customer)
                .licensePlate("51A-999.99")
                .brand("Honda")
                .model("Civic")
                .vehicleType(Vehicle.VehicleType.car)
                .isActive(true)
                .build();
        when(vehicleRepository.save(any(Vehicle.class))).thenReturn(savedVehicle);

        VehicleResponse response = vehicleService.addVehicle(1, request);

        assertNotNull(response);
        assertEquals("51A-999.99", response.getLicensePlate());
        assertEquals(10, response.getCustomerId());
    }

    @Test
    void testAddVehicleDuplicatePlateThrowsException() {
        Customer customer = Customer.builder()
                .customerId(10)
                .build();

        VehicleRequest request = new VehicleRequest();
        request.setLicensePlate("51A-999.99");
        request.setCustomerId(10);

        when(customerRepository.findByUser_Id(1)).thenReturn(Optional.of(customer));
        when(vehicleRepository.existsByLicensePlate("51A-999.99")).thenReturn(true);

        BusinessException exception = assertThrows(BusinessException.class,
                () -> vehicleService.addVehicle(1, request));
        assertEquals("Biển số xe này đã được đăng ký trong hệ thống", exception.getMessage());
    }

    @Test
    void testDeleteVehicleSuccess() {
        Customer customer = Customer.builder()
                .customerId(10)
                .build();

        Vehicle vehicle = Vehicle.builder()
                .vehicleId(1)
                .customer(customer)
                .licensePlate("51A-999.99")
                .isActive(true)
                .build();

        when(customerRepository.findByUser_Id(1)).thenReturn(Optional.of(customer));
        when(vehicleRepository.findByVehicleIdAndCustomer_CustomerId(1, 10)).thenReturn(Optional.of(vehicle));
        when(bookingRepository.existsByVehicle_VehicleIdAndStatusIn(eq(1), anyList())).thenReturn(false);

        vehicleService.deleteVehicle(1, 1);

        assertFalse(vehicle.getIsActive());
        verify(vehicleRepository, times(1)).save(vehicle);
    }

    @Test
    void testDeleteVehicleWithActiveBookingThrowsException() {
        Customer customer = Customer.builder()
                .customerId(10)
                .build();

        Vehicle vehicle = Vehicle.builder()
                .vehicleId(1)
                .customer(customer)
                .licensePlate("51A-999.99")
                .isActive(true)
                .build();

        when(customerRepository.findByUser_Id(1)).thenReturn(Optional.of(customer));
        when(vehicleRepository.findByVehicleIdAndCustomer_CustomerId(1, 10)).thenReturn(Optional.of(vehicle));
        when(bookingRepository.existsByVehicle_VehicleIdAndStatusIn(eq(1), anyList())).thenReturn(true);

        BusinessException exception = assertThrows(BusinessException.class,
                () -> vehicleService.deleteVehicle(1, 1));
        assertEquals("Không thể xóa xe đang có lịch đặt chưa hoàn thành", exception.getMessage());
    }
}
