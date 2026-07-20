package com.autowash.backend.booking.service.impl;

import com.autowash.backend.booking.dto.*;
import com.autowash.backend.booking.entity.Booking;
import com.autowash.backend.booking.entity.BookingDetail;
import com.autowash.backend.booking.enums.BookingStatus;
import com.autowash.backend.booking.mapper.BookingMapper;
import com.autowash.backend.booking.repository.BookingDetailRepository;
import com.autowash.backend.booking.repository.BookingRepository;
import com.autowash.backend.branch.entity.Branch;
import com.autowash.backend.branch.repository.BranchRepository;
import com.autowash.backend.common.exception.BusinessException;
import com.autowash.backend.common.exception.ResourceNotFoundException;
import com.autowash.backend.customer.entity.Customer;
import com.autowash.backend.customer.repository.CustomerRepository;
import com.autowash.backend.customerreward.repository.CustomerRewardRepository;
import com.autowash.backend.employee.repository.EmployeeRepository;
import com.autowash.backend.mail.service.MailService;
import com.autowash.backend.notification.service.NotificationService;
import com.autowash.backend.payment.repository.PaymentRepository;
import com.autowash.backend.promotion.repository.PromotionUseRepository;
import com.autowash.backend.servicepackage.entity.ServicePackage;
import com.autowash.backend.servicepackage.repository.ServicePackageRepository;
import com.autowash.backend.timeslot.entity.TimeSlot;
import com.autowash.backend.timeslot.repository.TimeSlotRepository;
import com.autowash.backend.vehicle.entity.Vehicle;
import com.autowash.backend.vehicle.repository.VehicleRepository;
import com.autowash.backend.washbay.entity.WashBay;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BookingServiceImplTest {

    @Mock
    private BookingRepository bookingRepository;
    @Mock
    private BookingDetailRepository bookingDetailRepository;
    @Mock
    private CustomerRepository customerRepository;
    @Mock
    private VehicleRepository vehicleRepository;
    @Mock
    private TimeSlotRepository timeSlotRepository;
    @Mock
    private BranchRepository branchRepository;
    @Mock
    private EmployeeRepository employeeRepository;
    @Mock
    private ServicePackageRepository servicePackageRepository;
    @Mock
    private BookingMapper bookingMapper;
    @Mock
    private MailService mailService;
    @Mock
    private NotificationService notificationService;
    @Mock
    private CustomerRewardRepository customerRewardRepository;
    @Mock
    private PaymentRepository paymentRepository;
    @Mock
    private PromotionUseRepository promotionUseRepository;

    @InjectMocks
    private BookingServiceImpl bookingService;

    @Test
    void testCreateBookingSuccess() {
        BookingCreateRequestDTO request = new BookingCreateRequestDTO();
        request.setCustomerId(10);
        request.setLicensePlate("51A-999.99");
        request.setVehicleType("car");
        request.setSlotId(100);
        request.setBranchId(1);
        request.setBrand("Ford");
        request.setModel("Everest");

        BookingCreateRequestDTO.BookingDetailItem detailItem = new BookingCreateRequestDTO.BookingDetailItem();
        detailItem.setServiceId(5);
        detailItem.setQuantity(1);
        request.setDetails(List.of(detailItem));

        Customer customer = Customer.builder()
                .customerId(10)
                .fullName("Test Customer")
                .build();

        Vehicle vehicle = Vehicle.builder()
                .vehicleId(2)
                .customer(customer)
                .licensePlate("51A-999.99")
                .vehicleType(Vehicle.VehicleType.FOUR_SEATS)
                .isActive(true)
                .build();

        WashBay washBay = new WashBay();
        washBay.setStatus(WashBay.BayStatus.available);

        // Khung giờ tương lai (ngày mai)
        TimeSlot slot = TimeSlot.builder()
                .slotId(100)
                .slotDate(LocalDate.now().plusDays(1))
                .startTime(LocalTime.of(10, 0))
                .endTime(LocalTime.of(11, 0))
                .washBay(washBay)
                .maxCapacity(2)
                .currentBookings(0)
                .status(TimeSlot.SlotStatus.open)
                .build();

        Branch branch = Branch.builder()
                .branchId(1)
                .status(Branch.BranchStatus.active)
                .build();

        ServicePackage servicePackage = ServicePackage.builder()
                .serviceId(5)
                .basePrice(BigDecimal.valueOf(100000))
                .build();

        when(customerRepository.findById(10)).thenReturn(Optional.of(customer));
        when(vehicleRepository.findByLicensePlate("51A-999.99")).thenReturn(Optional.of(vehicle));
        when(timeSlotRepository.findByIdForUpdate(100)).thenReturn(Optional.of(slot));
        when(branchRepository.findById(1)).thenReturn(Optional.of(branch));
        when(servicePackageRepository.findById(5)).thenReturn(Optional.of(servicePackage));

        Booking savedBooking = Booking.builder()
                .bookingId(1000)
                .bookingCode("BK-20260718-123456")
                .build();

        when(bookingRepository.save(any(Booking.class))).thenReturn(savedBooking);

        BookingCreateResponseDTO mockResponse = BookingCreateResponseDTO.builder()
                .bookingCode("BK-20260718-123456")
                .build();
        when(bookingMapper.toCreateResponse(any(), any(), any())).thenReturn(mockResponse);

        BookingCreateResponseDTO response = bookingService.createBooking(request, null);

        assertNotNull(response);
        assertEquals("BK-20260718-123456", response.getBookingCode());
        verify(bookingRepository, times(1)).save(any());
        verify(timeSlotRepository, times(1)).save(any());
    }

    @Test
    void testCreateBookingPastTimeThrowsException() {
        BookingCreateRequestDTO request = new BookingCreateRequestDTO();
        request.setCustomerId(10);
        request.setLicensePlate("51A-999.99");
        request.setVehicleType("car");
        request.setSlotId(100);

        Customer customer = Customer.builder()
                .customerId(10)
                .build();

        Vehicle vehicle = Vehicle.builder()
                .vehicleId(2)
                .customer(customer)
                .licensePlate("51A-999.99")
                .vehicleType(Vehicle.VehicleType.FOUR_SEATS)
                .build();

        WashBay washBay = new WashBay();
        washBay.setStatus(WashBay.BayStatus.available);

        // Khung giờ đã qua (hôm qua)
        TimeSlot slot = TimeSlot.builder()
                .slotId(100)
                .slotDate(LocalDate.now().minusDays(1))
                .startTime(LocalTime.of(10, 0))
                .endTime(LocalTime.of(11, 0))
                .washBay(washBay)
                .build();

        when(customerRepository.findById(10)).thenReturn(Optional.of(customer));
        when(vehicleRepository.findByLicensePlate("51A-999.99")).thenReturn(Optional.of(vehicle));
        when(timeSlotRepository.findByIdForUpdate(100)).thenReturn(Optional.of(slot));

        BusinessException exception = assertThrows(BusinessException.class,
                () -> bookingService.createBooking(request, null));
        assertTrue(exception.getMessage().contains("Không thể đặt lịch cho khung giờ đã qua"));
        assertEquals(HttpStatus.BAD_REQUEST, exception.getHttpStatus());
    }

    @Test
    void testCreateBookingSlotFullThrowsException() {
        BookingCreateRequestDTO request = new BookingCreateRequestDTO();
        request.setCustomerId(10);
        request.setLicensePlate("51A-999.99");
        request.setVehicleType("car");
        request.setSlotId(100);

        Customer customer = Customer.builder()
                .customerId(10)
                .build();

        Vehicle vehicle = Vehicle.builder()
                .vehicleId(2)
                .customer(customer)
                .licensePlate("51A-999.99")
                .vehicleType(Vehicle.VehicleType.FOUR_SEATS)
                .build();

        WashBay washBay = new WashBay();
        washBay.setStatus(WashBay.BayStatus.available);

        // Khung giờ đầy chỗ
        TimeSlot slot = TimeSlot.builder()
                .slotId(100)
                .slotDate(LocalDate.now().plusDays(1))
                .startTime(LocalTime.of(10, 0))
                .washBay(washBay)
                .maxCapacity(2)
                .currentBookings(2) // full
                .status(TimeSlot.SlotStatus.full)
                .build();

        when(customerRepository.findById(10)).thenReturn(Optional.of(customer));
        when(vehicleRepository.findByLicensePlate("51A-999.99")).thenReturn(Optional.of(vehicle));
        when(timeSlotRepository.findByIdForUpdate(100)).thenReturn(Optional.of(slot));

        BusinessException exception = assertThrows(BusinessException.class,
                () -> bookingService.createBooking(request, null));
        assertEquals("Slot đã đầy, vui lòng chọn khung giờ khác", exception.getMessage());
        assertEquals(HttpStatus.CONFLICT, exception.getHttpStatus());
    }
}
