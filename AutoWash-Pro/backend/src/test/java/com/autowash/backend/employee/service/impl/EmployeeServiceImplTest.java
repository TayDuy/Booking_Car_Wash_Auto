package com.autowash.backend.employee.service.impl;

import com.autowash.backend.booking.entity.Booking;
import com.autowash.backend.booking.entity.BookingDetail;
import com.autowash.backend.booking.enums.BookingStatus;
import com.autowash.backend.booking.repository.BookingDetailRepository;
import com.autowash.backend.booking.repository.BookingRepository;
import com.autowash.backend.branch.entity.Branch;
import com.autowash.backend.common.exception.BusinessException;
import com.autowash.backend.common.exception.ResourceNotFoundException;
import com.autowash.backend.customer.entity.Customer;
import com.autowash.backend.customer.repository.CustomerRepository;
import com.autowash.backend.employee.dto.EmployeeBookingCreateRequestDTO;
import com.autowash.backend.employee.dto.EmployeeProfileResponseDTO;
import com.autowash.backend.employee.dto.EmployeeQueueBookingResponseDTO;
import com.autowash.backend.employee.entity.Employee;
import com.autowash.backend.employee.mapper.EmployeeMapper;
import com.autowash.backend.employee.repository.EmployeeRepository;
import com.autowash.backend.loyaltytier.service.LoyaltyTierEvaluationService;
import com.autowash.backend.payment.repository.PaymentRepository;
import com.autowash.backend.loyaltytransaction.dto.LoyaltyTransactionResponseDTO;
import com.autowash.backend.loyaltytransaction.service.LoyaltyTransactionService;
import com.autowash.backend.servicepackage.entity.ServicePackage;
import com.autowash.backend.servicepackage.repository.ServicePackageRepository;
import com.autowash.backend.timeslot.entity.TimeSlot;
import com.autowash.backend.timeslot.repository.TimeSlotRepository;
import com.autowash.backend.user.entity.User;
import com.autowash.backend.user.repository.UserRepository;
import com.autowash.backend.vehicle.entity.Vehicle;
import com.autowash.backend.vehicle.repository.VehicleRepository;
import com.autowash.backend.washbay.entity.WashBay;
import com.autowash.backend.washbay.repository.WashBayRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

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
    @Mock private UserRepository userRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private PaymentRepository paymentRepository;
    @Mock private LoyaltyTransactionService loyaltyTransactionService;
    @Mock private LoyaltyTierEvaluationService loyaltyTierEvaluationService;

    @Captor private ArgumentCaptor<User> userCaptor;
    @Captor private ArgumentCaptor<Vehicle> vehicleCaptor;

    private EmployeeServiceImpl employeeService;
    private Employee employee;
    private Branch branch;
    private Customer customer;
    private Customer otherCustomer;

    @BeforeEach
    void setUp() {
        employeeService = new EmployeeServiceImpl(
                employeeRepository,
                bookingRepository,
                bookingDetailRepository,
                paymentRepository,
                employeeMapper,
                customerRepository,
                vehicleRepository,
                timeSlotRepository,
                servicePackageRepository,
                washBayRepository,
                userRepository,
                passwordEncoder,
                loyaltyTransactionService,
                loyaltyTierEvaluationService
        );

        branch = Branch.builder()
                .branchId(1)
                .branchName("Chi nhánh Test")
                .status(Branch.BranchStatus.active)
                .build();

        employee = Employee.builder()
                .employeeId(10)
                .branch(branch)
                .role(Employee.StaffRole.supervisor)
                .status(Employee.StaffStatus.active)
                .build();

        customer = Customer.builder()
                .customerId(100)
                .fullName("Nguyễn Văn A")
                .phone("+84901234567")
                .tierId(1)
                .totalPoints(0)
                .totalVisits(0)
                .totalSpending(BigDecimal.ZERO)
                .build();

        otherCustomer = Customer.builder()
                .customerId(200)
                .fullName("Khách hàng khác")
                .tierId(1)
                .totalPoints(0)
                .totalVisits(0)
                .totalSpending(BigDecimal.ZERO)
                .build();
    }

    @Nested
    class CreateWalkInBooking {

        @Test
        void shouldCreateAccountCustomerVehicleAndBookingForNewGuest() {
            EmployeeBookingCreateRequestDTO request =
                    createGuestRequest("51A-99999");

            mockActiveEmployee();

            when(userRepository.findByPhone("+84901234567"))
                    .thenReturn(Optional.empty());
            when(userRepository.existsByUsernameIgnoreCase("+84901234567"))
                    .thenReturn(false);
            when(passwordEncoder.encode("12345678"))
                    .thenReturn("encoded-password");
            when(userRepository.save(any(User.class)))
                    .thenAnswer(invocation -> {
                        User user = invocation.getArgument(0);
                        user.setId(300);
                        return user;
                    });
            when(customerRepository.save(any(Customer.class)))
                    .thenReturn(customer);
            when(vehicleRepository.findByLicensePlate("51A-99999"))
                    .thenReturn(Optional.empty());
            when(vehicleRepository.save(any(Vehicle.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            mockSuccessfulBookingCreation();

            employeeService.createBookingForCustomer(1, request);

            verify(userRepository).save(userCaptor.capture());
            User savedUser = userCaptor.getValue();
            assertEquals("+84901234567", savedUser.getUsername());
            assertEquals("+84901234567", savedUser.getPhone());
            assertEquals("encoded-password", savedUser.getPassword());
            assertEquals("customer", savedUser.getRole());

            verify(vehicleRepository).save(vehicleCaptor.capture());
            Vehicle savedVehicle = vehicleCaptor.getValue();
            assertEquals("51A-99999", savedVehicle.getLicensePlate());
            assertEquals(customer.getCustomerId(),
                    savedVehicle.getCustomer().getCustomerId());
            assertEquals(Vehicle.VehicleType.FOUR_SEATS,
                    savedVehicle.getVehicleType());
            assertEquals("Toyota", savedVehicle.getBrand());
            assertTrue(savedVehicle.getIsActive());
        }

        @Test
        void shouldReuseVehicleWhenItBelongsToSameCustomer() {
            EmployeeBookingCreateRequestDTO request =
                    createExistingCustomerRequest("30A-12345");

            Vehicle existingVehicle = vehicleOwnedBy(
                    customer,
                    "30A-12345"
            );

            mockActiveEmployee();
            when(customerRepository.findById(100))
                    .thenReturn(Optional.of(customer));
            when(vehicleRepository.findByLicensePlate("30A-12345"))
                    .thenReturn(Optional.of(existingVehicle));
            when(vehicleRepository.save(any(Vehicle.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            mockSuccessfulBookingCreation();

            employeeService.createBookingForCustomer(1, request);

            verify(vehicleRepository).save(vehicleCaptor.capture());
            Vehicle savedVehicle = vehicleCaptor.getValue();
            assertEquals(customer.getCustomerId(),
                    savedVehicle.getCustomer().getCustomerId());
            assertEquals("30A-12345", savedVehicle.getLicensePlate());
        }

        @Test
        void shouldRejectVehicleWhenPlateBelongsToAnotherCustomer() {
            EmployeeBookingCreateRequestDTO request =
                    createExistingCustomerRequest("30A-12345");

            Vehicle vehicleOfAnotherCustomer = vehicleOwnedBy(
                    otherCustomer,
                    "30A-12345"
            );

            mockActiveEmployee();
            when(customerRepository.findById(100))
                    .thenReturn(Optional.of(customer));
            when(vehicleRepository.findByLicensePlate("30A-12345"))
                    .thenReturn(Optional.of(vehicleOfAnotherCustomer));

            BusinessException exception = assertThrows(
                    BusinessException.class,
                    () -> employeeService.createBookingForCustomer(1, request)
            );

            assertTrue(exception.getMessage().contains(
                    "Biển số xe đã thuộc tài khoản khách hàng khác"
            ));
            verify(vehicleRepository, never()).save(any(Vehicle.class));
            verify(timeSlotRepository, never()).findByIdForUpdate(any());
            verify(bookingRepository, never()).save(any(Booking.class));
        }

        @Test
        void shouldUpdateBrandAndModelForVehicleOfSameCustomer() {
            EmployeeBookingCreateRequestDTO request =
                    createExistingCustomerRequest("30A-12345");
            request.setBrand("Honda");
            request.setModel("Civic");

            Vehicle existingVehicle = vehicleOwnedBy(
                    customer,
                    "30A-12345"
            );

            mockActiveEmployee();
            when(customerRepository.findById(100))
                    .thenReturn(Optional.of(customer));
            when(vehicleRepository.findByLicensePlate("30A-12345"))
                    .thenReturn(Optional.of(existingVehicle));
            when(vehicleRepository.save(any(Vehicle.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            mockSuccessfulBookingCreation();

            employeeService.createBookingForCustomer(1, request);

            verify(vehicleRepository).save(vehicleCaptor.capture());
            assertEquals("Honda", vehicleCaptor.getValue().getBrand());
            assertEquals("Civic", vehicleCaptor.getValue().getModel());
        }

        @Test
        void shouldNormalizeLicensePlateToUpperCase() {
            EmployeeBookingCreateRequestDTO request =
                    createExistingCustomerRequest("  30a-12345  ");

            Vehicle existingVehicle = vehicleOwnedBy(
                    customer,
                    "30A-12345"
            );

            mockActiveEmployee();
            when(customerRepository.findById(100))
                    .thenReturn(Optional.of(customer));
            when(vehicleRepository.findByLicensePlate("30A-12345"))
                    .thenReturn(Optional.of(existingVehicle));
            when(vehicleRepository.save(any(Vehicle.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            mockSuccessfulBookingCreation();

            employeeService.createBookingForCustomer(1, request);

            verify(vehicleRepository).findByLicensePlate("30A-12345");
            verify(vehicleRepository).save(vehicleCaptor.capture());
            assertEquals("30A-12345",
                    vehicleCaptor.getValue().getLicensePlate());
        }
    }

    @Nested
    class CreateBookingValidation {

        @Test
        void shouldRejectGuestWithoutName() {
            EmployeeBookingCreateRequestDTO request =
                    createGuestRequest("30A-12345");
            request.setGuestName("");

            mockActiveEmployee();

            assertThrows(
                    BusinessException.class,
                    () -> employeeService.createBookingForCustomer(1, request)
            );

            verify(userRepository, never()).save(any(User.class));
            verify(bookingRepository, never()).save(any(Booking.class));
        }

        @Test
        void shouldRejectBlankLicensePlateWithoutUnusedStubbing() {
            EmployeeBookingCreateRequestDTO request =
                    createExistingCustomerRequest("");

            mockActiveEmployee();
            when(customerRepository.findById(100))
                    .thenReturn(Optional.of(customer));

            BusinessException exception = assertThrows(
                    BusinessException.class,
                    () -> employeeService.createBookingForCustomer(1, request)
            );

            assertTrue(exception.getMessage().contains(
                    "Biển số xe không được để trống"
            ));
            verify(vehicleRepository, never()).findByLicensePlate(anyString());
            verify(bookingRepository, never()).save(any(Booking.class));
        }
    }

    @Nested
    class NoShowBooking {

        @Test
        void shouldMarkConfirmedBookingNoShowAfterGracePeriod() {
            TimeSlot pastSlot = createSlot(
                    LocalDate.now().minusDays(1),
                    LocalTime.of(10, 0)
            );
            Booking booking = Booking.builder()
                    .bookingId(500)
                    .bookingCode("BK-TEST-500")
                    .branch(branch)
                    .customer(customer)
                    .slot(pastSlot)
                    .status(BookingStatus.confirmed)
                    .build();

            mockActiveEmployee();
            when(bookingRepository.findEmployeeBookingById(500, 1))
                    .thenReturn(Optional.of(booking));
            when(bookingRepository.save(booking))
                    .thenReturn(booking);
            when(bookingDetailRepository.findByBooking(booking))
                    .thenReturn(List.of());
            when(employeeMapper.toQueueResponse(booking, List.of()))
                    .thenReturn(null);

            employeeService.markNoShow(1, 500);

            assertEquals(BookingStatus.no_show, booking.getStatus());
            assertEquals(0, pastSlot.getCurrentBookings());
            verify(timeSlotRepository).save(pastSlot);
        }

        @Test
        void shouldRejectNoShowBeforeGracePeriod() {
            TimeSlot futureSlot = createSlot(
                    LocalDate.now().plusDays(1),
                    LocalTime.of(10, 0)
            );
            Booking booking = Booking.builder()
                    .bookingId(501)
                    .bookingCode("BK-TEST-501")
                    .branch(branch)
                    .customer(customer)
                    .slot(futureSlot)
                    .status(BookingStatus.confirmed)
                    .build();

            mockActiveEmployee();
            when(bookingRepository.findEmployeeBookingById(501, 1))
                    .thenReturn(Optional.of(booking));

            assertThrows(
                    BusinessException.class,
                    () -> employeeService.markNoShow(1, 501)
            );

            assertEquals(BookingStatus.confirmed, booking.getStatus());
            verify(bookingRepository, never()).save(any(Booking.class));
            verify(timeSlotRepository, never()).save(any(TimeSlot.class));
        }
    }

    @Nested
    class ConfirmBooking {

        private Booking booking;

        @BeforeEach
        void setUp() {
            booking = Booking.builder()
                    .bookingId(500)
                    .bookingCode("BK-TEST-500")
                    .branch(branch)
                    .customer(customer)
                    .status(BookingStatus.pending)
                    .build();
        }

        @Test
        void shouldConfirmPendingBooking() {
            mockActiveEmployee();

            when(bookingRepository.findEmployeeBookingById(500, 1))
                    .thenReturn(Optional.of(booking));
            when(bookingRepository.save(booking))
                    .thenReturn(booking);
            when(employeeMapper.toQueueResponse(booking, List.of()))
                    .thenReturn(new EmployeeQueueBookingResponseDTO());

            EmployeeQueueBookingResponseDTO result =
                    employeeService.confirmBooking(1, 500);

            assertNotNull(result);
            assertEquals(BookingStatus.confirmed, booking.getStatus());
            verify(bookingRepository).save(booking);
        }

        @Test
        void shouldRejectConfirmWhenStatusIsNotPending() {
            booking.setStatus(BookingStatus.confirmed);
            mockActiveEmployee();

            when(bookingRepository.findEmployeeBookingById(500, 1))
                    .thenReturn(Optional.of(booking));

            BusinessException exception = assertThrows(
                    BusinessException.class,
                    () -> employeeService.confirmBooking(1, 500)
            );

            assertTrue(exception.getMessage().contains("xác nhận"));
            verify(bookingRepository, never()).save(any(Booking.class));
        }
    }

    @Nested
    class CheckInBooking {

        private Booking booking;

        @BeforeEach
        void setUp() {
            booking = Booking.builder()
                    .bookingId(500)
                    .bookingCode("BK-TEST-500")
                    .branch(branch)
                    .customer(customer)
                    .status(BookingStatus.confirmed)
                    .build();
        }

        @Test
        void shouldCheckInConfirmedBooking() {
            mockActiveEmployee();

            when(bookingRepository.findEmployeeBookingById(500, 1))
                    .thenReturn(Optional.of(booking));
            when(bookingRepository.save(booking))
                    .thenReturn(booking);
            when(employeeMapper.toQueueResponse(booking, List.of()))
                    .thenReturn(new EmployeeQueueBookingResponseDTO());

            EmployeeQueueBookingResponseDTO result =
                    employeeService.checkInBooking(1, 500);

            assertNotNull(result);
            assertEquals(BookingStatus.checked_in, booking.getStatus());
            assertNotNull(booking.getCheckInAt());
            verify(bookingRepository).save(booking);
        }

        @Test
        void shouldRejectCheckInWhenStatusIsNotConfirmed() {
            booking.setStatus(BookingStatus.checked_in);
            mockActiveEmployee();

            when(bookingRepository.findEmployeeBookingById(500, 1))
                    .thenReturn(Optional.of(booking));

            BusinessException exception = assertThrows(
                    BusinessException.class,
                    () -> employeeService.checkInBooking(1, 500)
            );

            assertTrue(exception.getMessage().contains("check-in"));
            verify(bookingRepository, never()).save(any(Booking.class));
        }
    }

    @Nested
    class StartWash {

        private Booking booking;
        private WashBay washBay;

        @BeforeEach
        void setUp() {
            washBay = WashBay.builder()
                    .bayId(20)
                    .bayName("Khu rửa số 1")
                    .branch(branch)
                    .status(WashBay.BayStatus.available)
                    .build();

            booking = Booking.builder()
                    .bookingId(500)
                    .bookingCode("BK-TEST-500")
                    .branch(branch)
                    .customer(customer)
                    .status(BookingStatus.checked_in)
                    .build();
        }

        @Test
        void shouldStartWashWithValidBayId() {
            mockActiveEmployee();

            when(bookingRepository.findEmployeeBookingById(500, 1))
                    .thenReturn(Optional.of(booking));
            when(washBayRepository.findById(20))
                    .thenReturn(Optional.of(washBay));
            when(bookingRepository.save(booking))
                    .thenReturn(booking);
            when(employeeMapper.toQueueResponse(booking, List.of()))
                    .thenReturn(new EmployeeQueueBookingResponseDTO());

            EmployeeQueueBookingResponseDTO result =
                    employeeService.startWash(1, 500, 20);

            assertNotNull(result);
            assertEquals(BookingStatus.in_progress, booking.getStatus());
            assertEquals(WashBay.BayStatus.occupied, washBay.getStatus());
            assertNotNull(booking.getAssignedStaff());
            assertEquals(10, booking.getAssignedStaff().getEmployeeId());
            verify(bookingRepository).save(booking);
        }

        @Test
        void shouldRejectStartWashWhenBayIsNotAvailable() {
            washBay.setStatus(WashBay.BayStatus.occupied);
            mockActiveEmployee();

            when(bookingRepository.findEmployeeBookingById(500, 1))
                    .thenReturn(Optional.of(booking));
            when(washBayRepository.findById(20))
                    .thenReturn(Optional.of(washBay));

            BusinessException exception = assertThrows(
                    BusinessException.class,
                    () -> employeeService.startWash(1, 500, 20)
            );

            assertTrue(exception.getMessage().contains("không khả dụng"));
            verify(bookingRepository, never()).save(any(Booking.class));
        }

        @Test
        void shouldRejectStartWashWhenBookingIsNotCheckedIn() {
            booking.setStatus(BookingStatus.in_progress);
            mockActiveEmployee();

            when(bookingRepository.findEmployeeBookingById(500, 1))
                    .thenReturn(Optional.of(booking));

            BusinessException exception = assertThrows(
                    BusinessException.class,
                    () -> employeeService.startWash(1, 500, 20)
            );

            assertTrue(exception.getMessage().contains("bắt đầu rửa"));
            verify(bookingRepository, never()).save(any(Booking.class));
        }

        @Test
        void shouldRejectStartWashWhenWashBayNotFound() {
            mockActiveEmployee();

            when(bookingRepository.findEmployeeBookingById(500, 1))
                    .thenReturn(Optional.of(booking));
            when(washBayRepository.findById(999))
                    .thenReturn(Optional.empty());

            assertThrows(
                    ResourceNotFoundException.class,
                    () -> employeeService.startWash(1, 500, 999)
            );

            verify(bookingRepository, never()).save(any(Booking.class));
        }

        @Test
        void shouldRejectStartWashWhenBayBelongsToDifferentBranch() {
            Branch otherBranch = Branch.builder()
                    .branchId(99)
                    .branchName("Chi nhánh khác")
                    .build();
            washBay.setBranch(otherBranch);
            mockActiveEmployee();

            when(bookingRepository.findEmployeeBookingById(500, 1))
                    .thenReturn(Optional.of(booking));
            when(washBayRepository.findById(20))
                    .thenReturn(Optional.of(washBay));

            BusinessException exception = assertThrows(
                    BusinessException.class,
                    () -> employeeService.startWash(1, 500, 20)
            );

            assertTrue(exception.getMessage().contains("không thuộc chi nhánh"));
            verify(bookingRepository, never()).save(any(Booking.class));
        }
    }

    @Nested
    class CompleteWash {

        private Booking booking;
        private WashBay washBay;
        private TimeSlot slot;

        @BeforeEach
        void setUp() {
            washBay = WashBay.builder()
                    .bayId(20)
                    .bayName("Khu rửa số 1")
                    .branch(branch)
                    .status(WashBay.BayStatus.occupied)
                    .build();

            slot = TimeSlot.builder()
                    .slotId(1)
                    .branch(branch)
                    .washBay(washBay)
                    .slotDate(LocalDate.now())
                    .startTime(LocalTime.of(10, 0))
                    .endTime(LocalTime.of(11, 0))
                    .maxCapacity(5)
                    .currentBookings(0)
                    .status(TimeSlot.SlotStatus.open)
                    .build();

            booking = Booking.builder()
                    .bookingId(500)
                    .bookingCode("BK-TEST-500")
                    .branch(branch)
                    .customer(customer)
                    .assignedStaff(employee)
                    .status(BookingStatus.in_progress)
                    .build();
            booking.setSlot(slot);
        }

        @Test
        void shouldCompleteInProgressBooking() {
            mockActiveEmployee();
            when(bookingRepository.findEmployeeBookingById(500, 1))
                    .thenReturn(Optional.of(booking));
            when(bookingRepository.save(booking))
                    .thenReturn(booking);
            when(washBayRepository.save(washBay))
                    .thenReturn(washBay);
            BookingDetail detail = BookingDetail.builder()
                    .subTotal(new BigDecimal("100000"))
                    .build();
            when(bookingDetailRepository.findByBooking(booking))
                    .thenReturn(List.of(detail));
            when(customerRepository.findByIdForUpdate(100))
                    .thenReturn(Optional.of(customer));
            when(loyaltyTransactionService.earnPointsFromCompleteBooking(
                    booking, new BigDecimal("100000")
            )).thenReturn(new LoyaltyTransactionResponseDTO());
            when(employeeMapper.toQueueResponse(booking, List.of(detail)))
                    .thenReturn(new EmployeeQueueBookingResponseDTO());

            EmployeeQueueBookingResponseDTO result =
                    employeeService.completeWash(1, 500);

            assertNotNull(result);
            assertEquals(BookingStatus.completed, booking.getStatus());
            assertEquals(WashBay.BayStatus.available, washBay.getStatus());
            assertNotNull(booking.getCompleteAt());
            verify(bookingRepository, times(2)).save(booking);
        }

        @Test
        void shouldRejectCompleteWhenStatusIsNotInProgress() {
            booking.setStatus(BookingStatus.completed);
            mockActiveEmployee();

            when(bookingRepository.findEmployeeBookingById(500, 1))
                    .thenReturn(Optional.of(booking));

            BusinessException exception = assertThrows(
                    BusinessException.class,
                    () -> employeeService.completeWash(1, 500)
            );

            assertTrue(exception.getMessage().contains("hoàn thành"));
            verify(bookingRepository, never()).save(any(Booking.class));
        }

        @Test
        void shouldRejectCompleteWhenWashBayIsNotOccupied() {
            washBay.setStatus(WashBay.BayStatus.available);
            mockActiveEmployee();

            when(bookingRepository.findEmployeeBookingById(500, 1))
                    .thenReturn(Optional.of(booking));

            BusinessException exception = assertThrows(
                    BusinessException.class,
                    () -> employeeService.completeWash(1, 500)
            );

            assertTrue(exception.getMessage().contains("Không thể hoàn thành"));
            verify(bookingRepository, never()).save(any(Booking.class));
        }
    }

    @Nested
    class GetMyProfile {

        @Test
        void shouldReturnProfileForActiveEmployee() {
            User user = User.builder()
                    .id(1)
                    .username("employee01")
                    .build();
            employee.setUser(user);

            mockActiveEmployee();

            EmployeeProfileResponseDTO expected =
                    new EmployeeProfileResponseDTO();
            when(employeeMapper.toProfileResponse(employee))
                    .thenReturn(expected);

            EmployeeProfileResponseDTO result =
                    employeeService.getMyProfile(1);

            assertNotNull(result);
            verify(employeeMapper).toProfileResponse(employee);
        }

        @Test
        void shouldThrowWhenUserIdIsNull() {
            assertThrows(
                    BusinessException.class,
                    () -> employeeService.getMyProfile(null)
            );
        }

        @Test
        void shouldThrowWhenEmployeeNotFound() {
            when(employeeRepository.findByUser_IdAndStatus(
                    1, Employee.StaffStatus.active
            )).thenReturn(Optional.empty());

            BusinessException exception = assertThrows(
                    BusinessException.class,
                    () -> employeeService.getMyProfile(1)
            );

            assertTrue(exception.getMessage().contains(
                    "Không tìm thấy hồ sơ nhân viên"
            ));
        }

        @Test
        void shouldThrowWhenEmployeeHasNoLinkedUser() {
            mockActiveEmployee();

            BusinessException exception = assertThrows(
                    BusinessException.class,
                    () -> employeeService.getMyProfile(1)
            );

            assertTrue(exception.getMessage().contains(
                    "chưa được liên kết"
            ));
        }

        @Test
        void shouldThrowWhenEmployeeHasNoBranch() {
            User user = User.builder()
                    .id(1)
                    .username("employee01")
                    .build();
            employee.setUser(user);
            employee.setBranch(null);

            mockActiveEmployee();

            BusinessException exception = assertThrows(
                    BusinessException.class,
                    () -> employeeService.getMyProfile(1)
            );

            assertTrue(exception.getMessage().contains(
                    "chưa được phân công chi nhánh"
            ));
        }
    }

    @Nested
    class GetMyBranchQueue {

        @Test
        void shouldReturnQueueForTodayWithDefaultStatuses() {
            Booking booking = Booking.builder()
                    .bookingId(500)
                    .bookingCode("BK-TEST-500")
                    .branch(branch)
                    .customer(customer)
                    .status(BookingStatus.pending)
                    .build();

            mockActiveEmployee();

            when(bookingRepository.findEmployeeQueue(
                    any(), any(), anyList()
            )).thenReturn(List.of(booking));

            when(bookingDetailRepository.findByBooking_BookingIdIn(
                    List.of(500)
            )).thenReturn(List.of());

            when(employeeMapper.toQueueResponse(booking, List.of()))
                    .thenReturn(new EmployeeQueueBookingResponseDTO());

            List<EmployeeQueueBookingResponseDTO> result =
                    employeeService.getMyBranchQueue(1, null, null);

            assertNotNull(result);
            assertEquals(1, result.size());
            verify(bookingRepository).findEmployeeQueue(
                    any(), any(), anyList()
            );
        }

        @Test
        void shouldReturnQueueForSpecificDateAndStatus() {
            Booking booking = Booking.builder()
                    .bookingId(500)
                    .bookingCode("BK-TEST-500")
                    .branch(branch)
                    .customer(customer)
                    .status(BookingStatus.confirmed)
                    .build();

            mockActiveEmployee();

            when(bookingRepository.findEmployeeQueue(
                    any(), any(), anyList()
            )).thenReturn(List.of(booking));

            when(bookingDetailRepository.findByBooking_BookingIdIn(
                    List.of(500)
            )).thenReturn(List.of());

            when(employeeMapper.toQueueResponse(booking, List.of()))
                    .thenReturn(new EmployeeQueueBookingResponseDTO());

            List<EmployeeQueueBookingResponseDTO> result =
                    employeeService.getMyBranchQueue(
                            1,
                            LocalDate.of(2026, 7, 21),
                            BookingStatus.confirmed
                    );

            assertNotNull(result);
            assertEquals(1, result.size());
        }

        @Test
        void shouldReturnEmptyListWhenNoBookings() {
            mockActiveEmployee();

            when(bookingRepository.findEmployeeQueue(
                    any(), any(), anyList()
            )).thenReturn(List.of());

            List<EmployeeQueueBookingResponseDTO> result =
                    employeeService.getMyBranchQueue(1, null, null);

            assertNotNull(result);
            assertTrue(result.isEmpty());
            verify(bookingDetailRepository, never())
                    .findByBooking_BookingIdIn(anyList());
        }

        @Test
        void shouldThrowWhenUserIdIsNull() {
            assertThrows(
                    BusinessException.class,
                    () -> employeeService.getMyBranchQueue(
                            null, null, null
                    )
            );
        }
    }

    @Nested
    class GetMyBranchBookingById {

        private Booking booking;

        @BeforeEach
        void setUp() {
            booking = Booking.builder()
                    .bookingId(500)
                    .bookingCode("BK-TEST-500")
                    .branch(branch)
                    .customer(customer)
                    .status(BookingStatus.pending)
                    .build();
        }

        @Test
        void shouldReturnBookingDetail() {
            mockActiveEmployee();

            when(bookingRepository.findEmployeeBookingById(500, 1))
                    .thenReturn(Optional.of(booking));
            when(bookingDetailRepository.findByBooking(booking))
                    .thenReturn(List.of());
            when(employeeMapper.toQueueResponse(booking, List.of()))
                    .thenReturn(new EmployeeQueueBookingResponseDTO());

            EmployeeQueueBookingResponseDTO result =
                    employeeService.getMyBranchBookingById(1, 500);

            assertNotNull(result);
            verify(bookingRepository).findEmployeeBookingById(500, 1);
        }

        @Test
        void shouldThrowWhenBookingNotFound() {
            mockActiveEmployee();

            when(bookingRepository.findEmployeeBookingById(500, 1))
                    .thenReturn(Optional.empty());

            BusinessException exception = assertThrows(
                    BusinessException.class,
                    () -> employeeService.getMyBranchBookingById(1, 500)
            );

            assertTrue(exception.getMessage().contains(
                    "Không tìm thấy booking"
            ));
        }

        @Test
        void shouldThrowWhenBookingIdIsNull() {
            mockActiveEmployee();

            BusinessException exception = assertThrows(
                    BusinessException.class,
                    () -> employeeService.getMyBranchBookingById(1, null)
            );

            assertTrue(exception.getMessage().contains(
                    "Booking ID không được để trống"
            ));
        }
    }

    @Nested
    class FindMyBranchBookingByCode {

        private Booking booking;

        @BeforeEach
        void setUp() {
            booking = Booking.builder()
                    .bookingId(500)
                    .bookingCode("BK-TEST-500")
                    .branch(branch)
                    .customer(customer)
                    .status(BookingStatus.pending)
                    .build();
        }

        @Test
        void shouldFindBookingByCode() {
            mockActiveEmployee();

            when(bookingRepository.findEmployeeBookingByCode(
                    "BK-TEST-500", 1
            )).thenReturn(Optional.of(booking));
            when(bookingDetailRepository.findByBooking(booking))
                    .thenReturn(List.of());
            when(employeeMapper.toQueueResponse(booking, List.of()))
                    .thenReturn(new EmployeeQueueBookingResponseDTO());

            EmployeeQueueBookingResponseDTO result =
                    employeeService.findMyBranchBookingByCode(
                            1, "BK-TEST-500"
                    );

            assertNotNull(result);
            verify(bookingRepository).findEmployeeBookingByCode(
                    "BK-TEST-500", 1
            );
        }

        @Test
        void shouldNormalizeBookingCode() {
            mockActiveEmployee();

            when(bookingRepository.findEmployeeBookingByCode(
                    "BK-TEST-500", 1
            )).thenReturn(Optional.of(booking));
            when(bookingDetailRepository.findByBooking(booking))
                    .thenReturn(List.of());
            when(employeeMapper.toQueueResponse(booking, List.of()))
                    .thenReturn(new EmployeeQueueBookingResponseDTO());

            employeeService.findMyBranchBookingByCode(
                    1, "  bk-test-500  "
            );

            verify(bookingRepository).findEmployeeBookingByCode(
                    "BK-TEST-500", 1
            );
        }

        @Test
        void shouldThrowWhenBookingNotFound() {
            mockActiveEmployee();

            when(bookingRepository.findEmployeeBookingByCode(
                    "BK-INVALID", 1
            )).thenReturn(Optional.empty());

            BusinessException exception = assertThrows(
                    BusinessException.class,
                    () -> employeeService.findMyBranchBookingByCode(
                            1, "BK-INVALID"
                    )
            );

            assertTrue(exception.getMessage().contains(
                    "Không tìm thấy booking"
            ));
        }

        @Test
        void shouldThrowWhenCodeIsNull() {
            mockActiveEmployee();

            BusinessException exception = assertThrows(
                    BusinessException.class,
                    () -> employeeService.findMyBranchBookingByCode(
                            1, null
                    )
            );

            assertTrue(exception.getMessage().contains(
                    "Mã booking không được để trống"
            ));
        }

        @Test
        void shouldThrowWhenCodeIsBlank() {
            mockActiveEmployee();

            BusinessException exception = assertThrows(
                    BusinessException.class,
                    () -> employeeService.findMyBranchBookingByCode(
                            1, "   "
                    )
            );

            assertTrue(exception.getMessage().contains(
                    "Mã booking không được để trống"
            ));
        }
    }

    private void mockActiveEmployee() {
        when(employeeRepository.findByUser_IdAndStatus(
                1,
                Employee.StaffStatus.active
        )).thenReturn(Optional.of(employee));
    }

    private void mockSuccessfulBookingCreation() {
        TimeSlot slot = createSlot(
                LocalDate.now().plusDays(1),
                LocalTime.of(10, 0)
        );

        when(timeSlotRepository.findByIdForUpdate(1))
                .thenReturn(Optional.of(slot));
        when(servicePackageRepository.findById(1))
                .thenReturn(Optional.of(createServicePackage()));
        when(bookingRepository.existsByBookingCode(anyString()))
                .thenReturn(false);
        when(bookingRepository.save(any(Booking.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(bookingDetailRepository.saveAll(anyList()))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(employeeMapper.toQueueResponse(any(Booking.class), anyList()))
                .thenReturn(null);
    }

    private EmployeeBookingCreateRequestDTO createGuestRequest(
            String licensePlate
    ) {
        EmployeeBookingCreateRequestDTO request =
                new EmployeeBookingCreateRequestDTO();

        request.setGuestName("Nguyễn Văn A");
        request.setGuestPhone("0901234567");
        request.setInitialPassword("12345678");
        request.setLicensePlate(licensePlate);
        request.setBrand("Toyota");
        request.setModel("Vios");
        request.setVehicleType("4_seats");
        request.setSlotId(1);
        request.setDetails(List.of(
                new EmployeeBookingCreateRequestDTO.ServiceItem(1, 1)
        ));

        return request;
    }

    private EmployeeBookingCreateRequestDTO createExistingCustomerRequest(
            String licensePlate
    ) {
        EmployeeBookingCreateRequestDTO request =
                createGuestRequest(licensePlate);

        request.setCustomerId(100);
        request.setGuestName(null);
        request.setGuestPhone(null);
        request.setInitialPassword(null);

        return request;
    }

    private Vehicle vehicleOwnedBy(
            Customer owner,
            String licensePlate
    ) {
        return Vehicle.builder()
                .vehicleId(50)
                .customer(owner)
                .licensePlate(licensePlate)
                .brand("Toyota")
                .model("Vios")
                .vehicleType(Vehicle.VehicleType.FOUR_SEATS)
                .isActive(true)
                .build();
    }

    private TimeSlot createSlot(
            LocalDate date,
            LocalTime startTime
    ) {
        return TimeSlot.builder()
                .slotId(1)
                .branch(branch)
                .slotDate(date)
                .startTime(startTime)
                .endTime(startTime.plusHours(1))
                .maxCapacity(5)
                .currentBookings(1)
                .status(TimeSlot.SlotStatus.open)
                .build();
    }

    private ServicePackage createServicePackage() {
        return ServicePackage.builder()
                .serviceId(1)
                .serviceName("Rửa xe cơ bản")
                .basePrice(new BigDecimal("100000"))
                .isActive(true)
                .build();
    }
}