package com.autowash.backend.employee.service.impl;

import com.autowash.backend.booking.entity.Booking;
import com.autowash.backend.booking.enums.BookingStatus;
import com.autowash.backend.booking.repository.BookingDetailRepository;
import com.autowash.backend.booking.repository.BookingRepository;
import com.autowash.backend.branch.entity.Branch;
import com.autowash.backend.common.exception.BusinessException;
import com.autowash.backend.customer.entity.Customer;
import com.autowash.backend.customer.repository.CustomerRepository;
import com.autowash.backend.employee.dto.EmployeeBookingCreateRequestDTO;
import com.autowash.backend.employee.entity.Employee;
import com.autowash.backend.employee.mapper.EmployeeMapper;
import com.autowash.backend.employee.repository.EmployeeRepository;
import com.autowash.backend.payment.repository.PaymentRepository;
import com.autowash.backend.payment.service.PaymentService;
import com.autowash.backend.payment.service.VNPayService;
import com.autowash.backend.servicepackage.entity.ServicePackage;
import com.autowash.backend.servicepackage.repository.ServicePackageRepository;
import com.autowash.backend.timeslot.entity.TimeSlot;
import com.autowash.backend.timeslot.repository.TimeSlotRepository;
import com.autowash.backend.vehicle.entity.Vehicle;
import com.autowash.backend.vehicle.repository.VehicleRepository;
import com.autowash.backend.washbay.repository.WashBayRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmployeeServiceImplTest {

    @Mock private EmployeeRepository employeeRepository;
    @Mock private BookingRepository bookingRepository;
    @Mock private BookingDetailRepository bookingDetailRepository;
    @Mock private EmployeeMapper employeeMapper;
    @Mock private CustomerRepository customerRepository;
    @Mock private VehicleRepository vehicleRepository;
    @Mock private TimeSlotRepository timeSlotRepository;
    @Mock private ServicePackageRepository servicePackageRepository;
    @Mock private WashBayRepository washBayRepository;
    @Mock private PaymentRepository paymentRepository;
    @Mock private PaymentService paymentService;
    @Mock private VNPayService vnPayService;

    @Captor private ArgumentCaptor<Vehicle> vehicleCaptor;

    private EmployeeServiceImpl employeeService;
    private Employee employee;
    private Branch branch;
    private Customer guestCustomer;
    private Customer existingCustomer;
    private Vehicle existingVehicle;

    @BeforeEach
    void setUp() {
        employeeService = new EmployeeServiceImpl(
                employeeRepository, bookingRepository, bookingDetailRepository,
                employeeMapper, customerRepository, vehicleRepository,
                timeSlotRepository, servicePackageRepository,
                washBayRepository, paymentRepository, paymentService, vnPayService
        );

        lenient().when(vehicleRepository.save(any(Vehicle.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        branch = Branch.builder()
                .branchId(1)
                .branchName("Chi nhánh Test")
                .status(Branch.BranchStatus.active)
                .build();

        employee = Employee.builder()
                .employeeId(10)
                .branch(branch)
                .status(Employee.StaffStatus.active)
                .build();

        guestCustomer = Customer.builder()
                .customerId(100)
                .fullName("Nguyễn Văn A")
                .phone("0901234567")
                .totalPoints(0)
                .totalVisits(0)
                .totalSpending(BigDecimal.ZERO)
                .build();

        existingCustomer = Customer.builder()
                .customerId(200)
                .fullName("Khách Cũ")
                .build();

        existingVehicle = Vehicle.builder()
                .vehicleId(50)
                .customer(existingCustomer)
                .licensePlate("30A-12345")
                .brand("Toyota")
                .model("Vios")
                .vehicleType(Vehicle.VehicleType.FOUR_SEATS)
                .isActive(true)
                .build();
    }

    private EmployeeBookingCreateRequestDTO createRequest(String licensePlate) {
        EmployeeBookingCreateRequestDTO request = new EmployeeBookingCreateRequestDTO();
        request.setCustomerId(null);
        request.setGuestName("Nguyễn Văn A");
        request.setGuestPhone("0901234567");
        request.setLicensePlate(licensePlate);
        request.setVehicleType("4_seats");
        request.setSlotId(1);
        request.setDetails(List.of(
                new EmployeeBookingCreateRequestDTO.ServiceItem(1, 1)
        ));
        request.setPaymentMethod("offline");
        return request;
    }

    @Nested
    class ResolveBookingVehicle {

        @Test
        void shouldCreateNewVehicleWhenLicensePlateNotFound() {
            EmployeeBookingCreateRequestDTO request = createRequest("51A-99999");

            when(employeeRepository.findByUser_IdAndStatus(1, Employee.StaffStatus.active))
                    .thenReturn(Optional.of(employee));
            when(customerRepository.findFirstByUserIsNullAndPhoneAndFullNameIgnoreCaseOrderByCustomerIdDesc(
                    "0901234567", "Nguyễn Văn A"))
                    .thenReturn(Optional.empty());
            when(customerRepository.save(any(Customer.class))).thenReturn(guestCustomer);
            when(vehicleRepository.findByLicensePlate("51A-99999")).thenReturn(Optional.empty());

            TimeSlot slot = createValidSlot();
            when(timeSlotRepository.findByIdForUpdate(1)).thenReturn(Optional.of(slot));
            when(servicePackageRepository.findById(1)).thenReturn(Optional.of(createServicePackage()));
            when(bookingRepository.save(any(Booking.class))).thenAnswer(inv -> inv.getArgument(0));
            when(bookingRepository.existsByBookingCode(anyString())).thenReturn(false);
            when(employeeMapper.toQueueResponse(any(), anyList())).thenReturn(null);

            employeeService.createBookingForCustomer(1, request);

            verify(vehicleRepository).save(vehicleCaptor.capture());
            Vehicle saved = vehicleCaptor.getValue();
            assertEquals("51A-99999", saved.getLicensePlate());
            assertEquals(guestCustomer.getCustomerId(), saved.getCustomer().getCustomerId());
            assertEquals(Vehicle.VehicleType.FOUR_SEATS, saved.getVehicleType());
            assertTrue(saved.getIsActive());
        }

        @Test
        void shouldReuseVehicleWhenLicensePlateBelongsToSameCustomer() {
            EmployeeBookingCreateRequestDTO request = createRequest("30A-12345");

            when(employeeRepository.findByUser_IdAndStatus(1, Employee.StaffStatus.active))
                    .thenReturn(Optional.of(employee));
            when(customerRepository.findFirstByUserIsNullAndPhoneAndFullNameIgnoreCaseOrderByCustomerIdDesc(
                    "0901234567", "Nguyễn Văn A"))
                    .thenReturn(Optional.empty());
            when(customerRepository.save(any(Customer.class))).thenReturn(guestCustomer);

            Vehicle sameCustomerVehicle = Vehicle.builder()
                    .vehicleId(50)
                    .customer(guestCustomer)
                    .licensePlate("30A-12345")
                    .brand("Toyota")
                    .model("Vios")
                    .vehicleType(Vehicle.VehicleType.FOUR_SEATS)
                    .isActive(true)
                    .build();

            when(vehicleRepository.findByLicensePlate("30A-12345")).thenReturn(Optional.of(sameCustomerVehicle));

            TimeSlot slot = createValidSlot();
            when(timeSlotRepository.findByIdForUpdate(1)).thenReturn(Optional.of(slot));
            when(servicePackageRepository.findById(1)).thenReturn(Optional.of(createServicePackage()));
            when(bookingRepository.save(any(Booking.class))).thenAnswer(inv -> inv.getArgument(0));
            when(bookingRepository.existsByBookingCode(anyString())).thenReturn(false);
            when(employeeMapper.toQueueResponse(any(), anyList())).thenReturn(null);

            employeeService.createBookingForCustomer(1, request);

            verify(vehicleRepository).save(vehicleCaptor.capture());
            Vehicle saved = vehicleCaptor.getValue();
            assertEquals(guestCustomer.getCustomerId(), saved.getCustomer().getCustomerId());
            assertEquals("30A-12345", saved.getLicensePlate());
        }

        @Test
        void shouldReassignVehicleWhenLicensePlateBelongsToDifferentCustomer() {
            EmployeeBookingCreateRequestDTO request = createRequest("30A-12345");

            when(employeeRepository.findByUser_IdAndStatus(1, Employee.StaffStatus.active))
                    .thenReturn(Optional.of(employee));
            when(customerRepository.findFirstByUserIsNullAndPhoneAndFullNameIgnoreCaseOrderByCustomerIdDesc(
                    "0901234567", "Nguyễn Văn A"))
                    .thenReturn(Optional.empty());
            when(customerRepository.save(any(Customer.class))).thenReturn(guestCustomer);
            when(vehicleRepository.findByLicensePlate("30A-12345")).thenReturn(Optional.of(existingVehicle));

            TimeSlot slot = createValidSlot();
            when(timeSlotRepository.findByIdForUpdate(1)).thenReturn(Optional.of(slot));
            when(servicePackageRepository.findById(1)).thenReturn(Optional.of(createServicePackage()));
            when(bookingRepository.save(any(Booking.class))).thenAnswer(inv -> inv.getArgument(0));
            when(bookingRepository.existsByBookingCode(anyString())).thenReturn(false);
            when(employeeMapper.toQueueResponse(any(), anyList())).thenReturn(null);

            employeeService.createBookingForCustomer(1, request);

            verify(vehicleRepository).save(vehicleCaptor.capture());
            Vehicle saved = vehicleCaptor.getValue();
            assertNotEquals(existingCustomer.getCustomerId(), saved.getCustomer().getCustomerId(),
                    "Vehicle should be reassigned away from existing customer");
            assertEquals(guestCustomer.getCustomerId(), saved.getCustomer().getCustomerId(),
                    "Vehicle should be reassigned to the new guest customer");
        }

        @Test
        void shouldUpdateBrandAndModelWhenProvided() {
            EmployeeBookingCreateRequestDTO request = createRequest("30A-12345");
            request.setBrand("Honda");
            request.setModel("Civic");

            when(employeeRepository.findByUser_IdAndStatus(1, Employee.StaffStatus.active))
                    .thenReturn(Optional.of(employee));
            when(customerRepository.findFirstByUserIsNullAndPhoneAndFullNameIgnoreCaseOrderByCustomerIdDesc(
                    "0901234567", "Nguyễn Văn A"))
                    .thenReturn(Optional.empty());
            when(customerRepository.save(any(Customer.class))).thenReturn(guestCustomer);
            when(vehicleRepository.findByLicensePlate("30A-12345")).thenReturn(Optional.of(existingVehicle));

            TimeSlot slot = createValidSlot();
            when(timeSlotRepository.findByIdForUpdate(1)).thenReturn(Optional.of(slot));
            when(servicePackageRepository.findById(1)).thenReturn(Optional.of(createServicePackage()));
            when(bookingRepository.save(any(Booking.class))).thenAnswer(inv -> inv.getArgument(0));
            when(bookingRepository.existsByBookingCode(anyString())).thenReturn(false);
            when(employeeMapper.toQueueResponse(any(), anyList())).thenReturn(null);

            employeeService.createBookingForCustomer(1, request);

            verify(vehicleRepository).save(vehicleCaptor.capture());
            Vehicle saved = vehicleCaptor.getValue();
            assertEquals("Honda", saved.getBrand());
            assertEquals("Civic", saved.getModel());
        }

        @Test
        void shouldNormalizeLicensePlateToUpperCase() {
            EmployeeBookingCreateRequestDTO request = createRequest("  30a-12345  ");

            when(employeeRepository.findByUser_IdAndStatus(1, Employee.StaffStatus.active))
                    .thenReturn(Optional.of(employee));
            when(customerRepository.findFirstByUserIsNullAndPhoneAndFullNameIgnoreCaseOrderByCustomerIdDesc(
                    "0901234567", "Nguyễn Văn A"))
                    .thenReturn(Optional.empty());
            when(customerRepository.save(any(Customer.class))).thenReturn(guestCustomer);
            when(vehicleRepository.findByLicensePlate("30A-12345")).thenReturn(Optional.of(existingVehicle));

            TimeSlot slot = createValidSlot();
            when(timeSlotRepository.findByIdForUpdate(1)).thenReturn(Optional.of(slot));
            when(servicePackageRepository.findById(1)).thenReturn(Optional.of(createServicePackage()));
            when(bookingRepository.save(any(Booking.class))).thenAnswer(inv -> inv.getArgument(0));
            when(bookingRepository.existsByBookingCode(anyString())).thenReturn(false);
            when(employeeMapper.toQueueResponse(any(), anyList())).thenReturn(null);

            employeeService.createBookingForCustomer(1, request);

            verify(vehicleRepository).findByLicensePlate("30A-12345");
            verify(vehicleRepository).save(vehicleCaptor.capture());
            assertEquals("30A-12345", vehicleCaptor.getValue().getLicensePlate());
        }
    }

    @Nested
    class CreateBookingValidation {

        @Test
        void shouldThrowWhenGuestNameIsMissing() {
            EmployeeBookingCreateRequestDTO request = new EmployeeBookingCreateRequestDTO();
            request.setGuestName("");
            request.setGuestPhone("0901234567");
            request.setLicensePlate("30A-12345");
            request.setVehicleType("4_seats");

            when(employeeRepository.findByUser_IdAndStatus(1, Employee.StaffStatus.active))
                    .thenReturn(Optional.of(employee));

            assertThrows(BusinessException.class,
                    () -> employeeService.createBookingForCustomer(1, request));
        }

        @Test
        void shouldThrowWhenLicensePlateIsBlank() {
            EmployeeBookingCreateRequestDTO request = createRequest("");

            when(employeeRepository.findByUser_IdAndStatus(1, Employee.StaffStatus.active))
                    .thenReturn(Optional.of(employee));
            when(customerRepository.findFirstByUserIsNullAndPhoneAndFullNameIgnoreCaseOrderByCustomerIdDesc(
                    "0901234567", "Nguyễn Văn A"))
                    .thenReturn(Optional.empty());
            when(customerRepository.save(any(Customer.class))).thenReturn(guestCustomer);

            assertThrows(BusinessException.class,
                    () -> employeeService.createBookingForCustomer(1, request));
        }
    }

    private TimeSlot createValidSlot() {
        return TimeSlot.builder()
                .slotId(1)
                .branch(branch)
                .slotDate(LocalDate.now().plusDays(1))
                .startTime(LocalTime.of(10, 0))
                .endTime(LocalTime.of(11, 0))
                .maxCapacity(5)
                .currentBookings(0)
                .status(TimeSlot.SlotStatus.open)
                .build();
    }

    private ServicePackage createServicePackage() {
        return ServicePackage.builder()
                .serviceId(1)
                .serviceName("Rửa xe cơ bản")
                .basePrice(new BigDecimal("100000"))
                .build();
    }
}