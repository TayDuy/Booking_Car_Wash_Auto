package com.autowash.backend;

import com.autowash.backend.booking.dto.BookingCreateRequestDTO;
import com.autowash.backend.booking.dto.BookingCreateResponseDTO;
import com.autowash.backend.booking.entity.Booking;
import com.autowash.backend.booking.enums.BookingStatus;
import com.autowash.backend.booking.repository.BookingRepository;
import com.autowash.backend.booking.service.BookingService;
import com.autowash.backend.branch.entity.Branch;
import com.autowash.backend.branch.repository.BranchRepository;
import com.autowash.backend.common.exception.BusinessException;
import com.autowash.backend.customer.dto.CustomerProfileResponse;
import com.autowash.backend.customer.dto.CustomerUpdateRequest;
import com.autowash.backend.customer.entity.Customer;
import com.autowash.backend.customer.repository.CustomerRepository;
import com.autowash.backend.customer.service.CustomerService;
import com.autowash.backend.employee.entity.Employee;
import com.autowash.backend.employee.repository.EmployeeRepository;
import com.autowash.backend.employee.service.EmployeeService;
import com.autowash.backend.loyaltytier.entity.LoyaltyTier;
import com.autowash.backend.loyaltytier.repository.CustomerTierHistoryRepository;
import com.autowash.backend.loyaltytier.repository.LoyaltyTierRepository;
import com.autowash.backend.loyaltytier.service.LoyaltyTierEvaluationService;
import com.autowash.backend.notification.entity.Notification;
import com.autowash.backend.notification.repository.NotificationRepository;
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
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
class AcceptanceTest {

    @Autowired private BookingService bookingService;
    @Autowired private CustomerService customerService;
    @Autowired private EmployeeService employeeService;
    @Autowired private LoyaltyTierEvaluationService loyaltyTierEvaluationService;

    @Autowired private UserRepository userRepository;
    @Autowired private CustomerRepository customerRepository;
    @Autowired private VehicleRepository vehicleRepository;
    @Autowired private BranchRepository branchRepository;
    @Autowired private WashBayRepository washBayRepository;
    @Autowired private TimeSlotRepository timeSlotRepository;
    @Autowired private ServicePackageRepository servicePackageRepository;
    @Autowired private BookingRepository bookingRepository;
    @Autowired private EmployeeRepository employeeRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private LoyaltyTierRepository loyaltyTierRepository;
    @Autowired private CustomerTierHistoryRepository customerTierHistoryRepository;
    @Autowired private NotificationRepository notificationRepository;

    @Nested
    @DisplayName("BR-66: Privacy Consent — Customer updates allowDataSharing")
    class PrivacyConsentAcceptance {

        private Customer testCustomer;
        private User testUser;

        @BeforeEach
        void setUp() {
            testUser = userRepository.save(User.builder()
                    .username("privacy_test_" + System.currentTimeMillis())
                    .password(passwordEncoder.encode("test@123"))
                    .phone("0988777001")
                    .email("privacy@test.com")
                    .role("customer")
                    .status("active")
                    .build());

            LoyaltyTier memberTier = loyaltyTierRepository.findById(1)
                    .orElseGet(() -> loyaltyTierRepository.save(LoyaltyTier.builder()
                            .tierId(1).tierName("Member").bookingWindowDays(7)
                            .minPoints(0).minVisits(0).minSpending(BigDecimal.ZERO)
                            .priorityLevel(0).isActive(true).build()));

            testCustomer = customerRepository.save(Customer.builder()
                    .user(testUser)
                    .fullName("Nguyễn Văn Privacy")
                    .phone("0988777001")
                    .tierId(memberTier.getTierId())
                    .totalPoints(0).totalVisits(0).totalSpending(BigDecimal.ZERO)
                    .allowDataSharing(false)
                    .build());
        }

        @Test
        @DisplayName("Customer enables data sharing — flag changes from false to true")
        void customerEnablesDataSharing() {
            assertFalse(testCustomer.getAllowDataSharing());

            CustomerUpdateRequest request = new CustomerUpdateRequest();
            request.setFullName(testCustomer.getFullName());
            request.setPhone(testUser.getPhone());
            request.setAllowDataSharing(true);

            CustomerProfileResponse response = customerService.updateCustomerProfile(
                    testUser.getId(), request);

            assertTrue(response.getAllowDataSharing());

            Customer reloaded = customerRepository.findById(
                    testCustomer.getCustomerId()).get();
            assertTrue(reloaded.getAllowDataSharing());
        }

        @Test
        @DisplayName("Customer disables data sharing — flag changes from true to false")
        void customerDisablesDataSharing() {
            testCustomer.setAllowDataSharing(true);
            customerRepository.save(testCustomer);

            CustomerUpdateRequest request = new CustomerUpdateRequest();
            request.setFullName(testCustomer.getFullName());
            request.setPhone(testUser.getPhone());
            request.setAllowDataSharing(false);

            CustomerProfileResponse response = customerService.updateCustomerProfile(
                    testUser.getId(), request);

            assertFalse(response.getAllowDataSharing());
        }

        @Test
        @DisplayName("Customer omits allowDataSharing — existing value is preserved")
        void customerOmitsDataSharingPreservesValue() {
            testCustomer.setAllowDataSharing(true);
            customerRepository.save(testCustomer);

            CustomerUpdateRequest request = new CustomerUpdateRequest();
            request.setFullName(testCustomer.getFullName());
            request.setPhone(testUser.getPhone());

            CustomerProfileResponse response = customerService.updateCustomerProfile(
                    testUser.getId(), request);

            assertTrue(response.getAllowDataSharing());
        }

        @Test
        @DisplayName("Admin/staff updates customer allowDataSharing via updateCustomer")
        void adminUpdatesAllowDataSharing() {
            CustomerUpdateRequest request = new CustomerUpdateRequest();
            request.setFullName(testCustomer.getFullName());
            request.setEmail(testUser.getEmail());
            request.setPhone(testUser.getPhone());
            request.setAllowDataSharing(true);

            CustomerProfileResponse response = customerService.updateCustomer(
                    testCustomer.getCustomerId(), request);

            assertTrue(response.getAllowDataSharing());
        }
    }

    @Nested
    @DisplayName("BR-11: Overlapping Booking — Customer creates booking with time conflict")
    class OverlappingBookingAcceptance {

        private Branch testBranch;
        private WashBay testWashBay;
        private TimeSlot testSlot;
        private ServicePackage testService;
        private Customer testCustomer;
        private User testUser;
        private Vehicle testVehicle;

        @BeforeEach
        void setUp() {
            testBranch = branchRepository.save(Branch.builder()
                    .branchName("CN Overlap Test")
                    .address("456 Overlap Street")
                    .phone("02899990001")
                    .capacity(2)
                    .status(Branch.BranchStatus.active)
                    .build());

            testWashBay = washBayRepository.save(WashBay.builder()
                    .branch(testBranch)
                    .bayName("Khoang Overlap")
                    .status(WashBay.BayStatus.available)
                    .capacity(1)
                    .build());

            testSlot = timeSlotRepository.save(TimeSlot.builder()
                    .branch(testBranch)
                    .washBay(testWashBay)
                    .slotDate(LocalDate.now().plusDays(1))
                    .startTime(LocalTime.of(10, 0))
                    .endTime(LocalTime.of(11, 0))
                    .maxCapacity(2)
                    .currentBookings(0)
                    .status(TimeSlot.SlotStatus.open)
                    .build());

            testService = servicePackageRepository.save(ServicePackage.builder()
                    .serviceName("Rửa xe Overlap")
                    .basePrice(new BigDecimal("100000"))
                    .isActive(true)
                    .build());

            testUser = userRepository.save(User.builder()
                    .username("overlap_test_" + System.currentTimeMillis())
                    .password(passwordEncoder.encode("test@123"))
                    .phone("0988777002")
                    .email("overlap@test.com")
                    .role("customer")
                    .status("active")
                    .build());

            LoyaltyTier memberTier = loyaltyTierRepository.findById(1)
                    .orElseGet(() -> loyaltyTierRepository.save(LoyaltyTier.builder()
                            .tierId(1).tierName("Member").bookingWindowDays(7)
                            .minPoints(0).minVisits(0).minSpending(BigDecimal.ZERO)
                            .priorityLevel(0).isActive(true).build()));

            testCustomer = customerRepository.save(Customer.builder()
                    .user(testUser)
                    .fullName("Nguyễn Văn Overlap")
                    .phone("0988777002")
                    .tierId(memberTier.getTierId())
                    .totalPoints(0).totalVisits(0).totalSpending(BigDecimal.ZERO)
                    .build());

            testVehicle = vehicleRepository.save(Vehicle.builder()
                    .customer(testCustomer)
                    .licensePlate("OVERLAP-01")
                    .brand("Toyota").model("Vios")
                    .vehicleType(Vehicle.VehicleType.FOUR_SEATS)
                    .isActive(true)
                    .build());
        }

        private BookingCreateRequestDTO buildRequest(Integer slotId) {
            BookingCreateRequestDTO r = new BookingCreateRequestDTO();
            r.setCustomerId(testCustomer.getCustomerId());
            r.setLicensePlate(testVehicle.getLicensePlate());
            r.setBrand("Toyota");
            r.setVehicleType("4_seats");
            r.setSlotId(slotId);
            r.setBranchId(testBranch.getBranchId());
            r.setDetails(List.of(
                    BookingCreateRequestDTO.BookingDetailItem.builder()
                            .serviceId(testService.getServiceId())
                            .quantity(1).build()
            ));
            return r;
        }

        @Test
        @DisplayName("Create booking without overlap — success")
        void createBookingWithoutOverlapSucceeds() {
            BookingCreateResponseDTO response = bookingService.createBooking(
                    buildRequest(testSlot.getSlotId()), testUser.getId());

            assertNotNull(response);
            assertNotNull(response.getBookingCode());
            assertTrue(response.getBookingCode().startsWith("BK-"));
        }

        @Test
        @DisplayName("Create booking overlapping existing one — 409 CONFLICT")
        void createBookingWithOverlapThrowsConflict() {
            bookingService.createBooking(
                    buildRequest(testSlot.getSlotId()), testUser.getId());

            BusinessException exception = assertThrows(BusinessException.class,
                    () -> bookingService.createBooking(
                            buildRequest(testSlot.getSlotId()), testUser.getId()));
            assertEquals(HttpStatus.CONFLICT, exception.getHttpStatus());
        }

        @Test
        @DisplayName("Customer cannot book a past time slot — 400 BAD_REQUEST")
        void cannotBookPastSlot() {
            TimeSlot pastSlot = timeSlotRepository.save(TimeSlot.builder()
                    .branch(testBranch).washBay(testWashBay)
                    .slotDate(LocalDate.now().minusDays(1))
                    .startTime(LocalTime.of(10, 0))
                    .endTime(LocalTime.of(11, 0))
                    .maxCapacity(2).currentBookings(0)
                    .status(TimeSlot.SlotStatus.open)
                    .build());

            BusinessException exception = assertThrows(BusinessException.class,
                    () -> bookingService.createBooking(
                            buildRequest(pastSlot.getSlotId()), testUser.getId()));
            assertTrue(exception.getMessage().contains("khung giờ đã qua"));
        }
    }

    @Nested
    @DisplayName("BR-24→27: Booking Window by Tier — Customer restricted by loyalty tier")
    class BookingWindowAcceptance {

        private Branch testBranch;
        private WashBay testWashBay;
        private TimeSlot nearSlot;
        private TimeSlot farSlot;
        private ServicePackage testService;
        private Customer testCustomer;
        private User testUser;
        private Vehicle testVehicle;

        @BeforeEach
        void setUp() {
            testBranch = branchRepository.save(Branch.builder()
                    .branchName("CN Window Test")
                    .address("789 Window Street")
                    .phone("02899990003")
                    .capacity(2)
                    .status(Branch.BranchStatus.active)
                    .build());

            testWashBay = washBayRepository.save(WashBay.builder()
                    .branch(testBranch)
                    .bayName("Khoang Window")
                    .status(WashBay.BayStatus.available)
                    .capacity(1)
                    .build());

            nearSlot = timeSlotRepository.save(TimeSlot.builder()
                    .branch(testBranch).washBay(testWashBay)
                    .slotDate(LocalDate.now().plusDays(1))
                    .startTime(LocalTime.of(10, 0))
                    .endTime(LocalTime.of(11, 0))
                    .maxCapacity(2).currentBookings(0)
                    .status(TimeSlot.SlotStatus.open)
                    .build());

            farSlot = timeSlotRepository.save(TimeSlot.builder()
                    .branch(testBranch).washBay(testWashBay)
                    .slotDate(LocalDate.now().plusDays(14))
                    .startTime(LocalTime.of(14, 0))
                    .endTime(LocalTime.of(15, 0))
                    .maxCapacity(2).currentBookings(0)
                    .status(TimeSlot.SlotStatus.open)
                    .build());

            testService = servicePackageRepository.save(ServicePackage.builder()
                    .serviceName("Rửa xe Window")
                    .basePrice(new BigDecimal("100000"))
                    .isActive(true)
                    .build());

            testUser = userRepository.save(User.builder()
                    .username("window_test_" + System.currentTimeMillis())
                    .password(passwordEncoder.encode("test@123"))
                    .phone("0988777004")
                    .email("window@test.com")
                    .role("customer")
                    .status("active")
                    .build());

            LoyaltyTier memberTier = loyaltyTierRepository.findById(1)
                    .orElseGet(() -> loyaltyTierRepository.save(LoyaltyTier.builder()
                            .tierId(1).tierName("Member").bookingWindowDays(7)
                            .minPoints(0).minVisits(0).minSpending(BigDecimal.ZERO)
                            .priorityLevel(0).isActive(true).build()));

            testCustomer = customerRepository.save(Customer.builder()
                    .user(testUser)
                    .fullName("Nguyễn Văn Window")
                    .phone("0988777004")
                    .tierId(memberTier.getTierId())
                    .totalPoints(0).totalVisits(0).totalSpending(BigDecimal.ZERO)
                    .build());

            testVehicle = vehicleRepository.save(Vehicle.builder()
                    .customer(testCustomer)
                    .licensePlate("WINDOW-01")
                    .brand("Toyota").model("Vios")
                    .vehicleType(Vehicle.VehicleType.FOUR_SEATS)
                    .isActive(true)
                    .build());
        }

        private BookingCreateRequestDTO buildRequest(Integer slotId) {
            BookingCreateRequestDTO r = new BookingCreateRequestDTO();
            r.setCustomerId(testCustomer.getCustomerId());
            r.setLicensePlate(testVehicle.getLicensePlate());
            r.setBrand("Toyota");
            r.setVehicleType("4_seats");
            r.setSlotId(slotId);
            r.setBranchId(testBranch.getBranchId());
            r.setDetails(List.of(
                    BookingCreateRequestDTO.BookingDetailItem.builder()
                            .serviceId(testService.getServiceId())
                            .quantity(1).build()
            ));
            return r;
        }

        @Test
        @DisplayName("Member books within 7-day window — success")
        void createBookingWithinWindowSucceeds() {
            BookingCreateResponseDTO response = bookingService.createBooking(
                    buildRequest(nearSlot.getSlotId()), testUser.getId());

            assertNotNull(response);
            assertNotNull(response.getBookingCode());
        }

        @Test
        @DisplayName("Member books 14 days ahead (beyond 7-day window) — 400 BAD_REQUEST")
        void createBookingExceedingWindowThrowsBadRequest() {
            BusinessException exception = assertThrows(BusinessException.class,
                    () -> bookingService.createBooking(
                            buildRequest(farSlot.getSlotId()), testUser.getId()));
            assertTrue(exception.getMessage().contains("chỉ được phép đặt lịch trước tối đa"));
            assertEquals(HttpStatus.BAD_REQUEST, exception.getHttpStatus());
        }

        @Test
        @DisplayName("Create booking when slot is full — 409 CONFLICT")
        void createBookingWhenSlotFullThrowsConflict() {
            TimeSlot fullSlot = timeSlotRepository.save(TimeSlot.builder()
                    .branch(testBranch).washBay(testWashBay)
                    .slotDate(LocalDate.now().plusDays(1))
                    .startTime(LocalTime.of(15, 0))
                    .endTime(LocalTime.of(16, 0))
                    .maxCapacity(2).currentBookings(2)
                    .status(TimeSlot.SlotStatus.full)
                    .build());

            BusinessException exception = assertThrows(BusinessException.class,
                    () -> bookingService.createBooking(
                            buildRequest(fullSlot.getSlotId()), testUser.getId()));
            assertEquals("Slot đã đầy, vui lòng chọn khung giờ khác",
                    exception.getMessage());
            assertEquals(HttpStatus.CONFLICT, exception.getHttpStatus());
        }
    }

    @Nested
    @DisplayName("BR-23 + BR-32: Loyalty Tier History & Notification on tier change")
    class TierHistoryAndNotificationAcceptance {

        private User testUser;
        private Customer testCustomer;
        private LoyaltyTier memberTier;

        @BeforeEach
        void setUp() {
            memberTier = loyaltyTierRepository.findById(1)
                    .orElseGet(() -> loyaltyTierRepository.save(LoyaltyTier.builder()
                            .tierId(1).tierName("Member").bookingWindowDays(7)
                            .minPoints(0).minVisits(0).minSpending(BigDecimal.ZERO)
                            .priorityLevel(0).isActive(true).build()));

            testUser = userRepository.save(User.builder()
                    .username("tier_test_" + System.currentTimeMillis())
                    .password(passwordEncoder.encode("test@123"))
                    .phone("0988777005")
                    .email("tier@test.com")
                    .role("customer")
                    .status("active")
                    .build());

            testCustomer = customerRepository.save(Customer.builder()
                    .user(testUser)
                    .fullName("Nguyễn Văn Tier")
                    .phone("0988777005")
                    .tierId(memberTier.getTierId())
                    .totalPoints(0).totalVisits(0).totalSpending(BigDecimal.ZERO)
                    .build());
        }

        @Test
        @DisplayName("Tier evaluation creates history entry when tier changes")
        void tierEvaluationCreatesHistoryOnUpgrade() {
            testCustomer.setTotalPoints(9999);
            testCustomer.setTotalVisits(999);
            testCustomer.setTotalSpending(new BigDecimal("99999999"));
            customerRepository.save(testCustomer);

            var result = loyaltyTierEvaluationService.evaluateCustomerTierByUserId(
                    testUser.getId());

            assertNotNull(result);
            List<com.autowash.backend.loyaltytier.entity.CustomerTierHistory> histories =
                    customerTierHistoryRepository
                            .findByCustomer_CustomerIdOrderByChangedAtDesc(
                                    testCustomer.getCustomerId());
            assertFalse(histories.isEmpty());
        }

        @Test
        @DisplayName("Tier upgrade triggers in-app TIER_UPGRADED notification")
        void tierUpgradeCreatesNotification() {
            testCustomer.setTotalPoints(9999);
            testCustomer.setTotalVisits(999);
            testCustomer.setTotalSpending(new BigDecimal("99999999"));
            customerRepository.save(testCustomer);

            loyaltyTierEvaluationService.evaluateCustomerTierByUserId(
                    testUser.getId());

            List<Notification> notifications = notificationRepository
                    .findByUserIdOrderByCreatedAtDesc(testUser.getId());
            boolean hasTierNotification = notifications.stream()
                    .anyMatch(n -> n.getType()
                            == Notification.NotificationType.TIER_UPGRADED);
            assertTrue(hasTierNotification,
                    "Should have at least one TIER_UPGRADED notification");
        }
    }

    @Nested
    @DisplayName("Employee creates walk-in booking for guest")
    class EmployeeWalkInBookingAcceptance {

        private Branch testBranch;
        private WashBay testWashBay;
        private TimeSlot testSlot;
        private ServicePackage testService;
        private User employeeUser;
        private Employee testEmployee;

        @BeforeEach
        void setUp() {
            testBranch = branchRepository.save(Branch.builder()
                    .branchName("CN WalkIn Test")
                    .address("101 WalkIn Street")
                    .phone("02899990006")
                    .capacity(2)
                    .status(Branch.BranchStatus.active)
                    .build());

            testWashBay = washBayRepository.save(WashBay.builder()
                    .branch(testBranch)
                    .bayName("Khoang WalkIn")
                    .status(WashBay.BayStatus.available)
                    .capacity(1)
                    .build());

            testSlot = timeSlotRepository.save(TimeSlot.builder()
                    .branch(testBranch).washBay(testWashBay)
                    .slotDate(LocalDate.now().plusDays(1))
                    .startTime(LocalTime.of(10, 0))
                    .endTime(LocalTime.of(11, 0))
                    .maxCapacity(2).currentBookings(0)
                    .status(TimeSlot.SlotStatus.open)
                    .build());

            testService = servicePackageRepository.save(ServicePackage.builder()
                    .serviceName("Rửa xe WalkIn")
                    .basePrice(new BigDecimal("100000"))
                    .isActive(true)
                    .build());

            employeeUser = userRepository.save(User.builder()
                    .username("employee_walkin_" + System.currentTimeMillis())
                    .password(passwordEncoder.encode("emp@123"))
                    .phone("0988777007")
                    .email("emp_walkin@test.com")
                    .role("employee")
                    .status("active")
                    .build());

            testEmployee = employeeRepository.save(Employee.builder()
                    .user(employeeUser)
                    .branch(testBranch)
                    .fullName("Nhân viên WalkIn")
                    .phone("0988777007")
                    .role(Employee.StaffRole.supervisor)
                    .status(Employee.StaffStatus.active)
                    .build());
        }

        @Test
        @DisplayName("Employee creates booking for walk-in guest — full success")
        void employeeCreatesWalkInBooking() {
            com.autowash.backend.employee.dto.EmployeeBookingCreateRequestDTO request =
                    com.autowash.backend.employee.dto.EmployeeBookingCreateRequestDTO.builder()
                            .guestName("Khách vãng lai Test")
                            .guestPhone("0912345678")
                            .initialPassword("pass@123")
                            .licensePlate("WALKIN-001")
                            .brand("Honda")
                            .model("Civic")
                            .vehicleType("4_seats")
                            .slotId(testSlot.getSlotId())
                            .details(List.of(
                                    new com.autowash.backend.employee.dto
                                            .EmployeeBookingCreateRequestDTO
                                            .ServiceItem(
                                            testService.getServiceId(), 1)
                            ))
                            .build();

            com.autowash.backend.employee.dto.EmployeeQueueBookingResponseDTO response =
                    employeeService.createBookingForCustomer(
                            employeeUser.getId(), request);

            assertNotNull(response);
            assertNotNull(response.getBookingCode());
            assertTrue(response.getAccountCreated(),
                    "New guest account should be marked as created");
            assertNotNull(response.getCustomerName());
            assertEquals("Khách vãng lai Test", response.getCustomerName());
        }

        @Test
        @DisplayName("Employee creates booking for existing customer — no new account")
        void employeeCreatesBookingForExistingCustomer() {
            User existingUser = userRepository.save(User.builder()
                    .username("existing_" + System.currentTimeMillis())
                    .password(passwordEncoder.encode("test@123"))
                    .phone("0988777008")
                    .email("existing@test.com")
                    .role("customer")
                    .status("active")
                    .build());

            LoyaltyTier memberTier = loyaltyTierRepository.findById(1)
                    .orElseGet(() -> loyaltyTierRepository.save(LoyaltyTier.builder()
                            .tierId(1).tierName("Member").bookingWindowDays(7)
                            .minPoints(0).minVisits(0).minSpending(BigDecimal.ZERO)
                            .priorityLevel(0).isActive(true).build()));

            Customer existingCustomer = customerRepository.save(Customer.builder()
                    .user(existingUser)
                    .fullName("Khách hàng cũ")
                    .phone("0988777008")
                    .tierId(memberTier.getTierId())
                    .totalPoints(0).totalVisits(0).totalSpending(BigDecimal.ZERO)
                    .build());

            Vehicle existingVehicle = vehicleRepository.save(Vehicle.builder()
                    .customer(existingCustomer)
                    .licensePlate("EXIST-01")
                    .brand("Honda").model("Civic")
                    .vehicleType(Vehicle.VehicleType.FOUR_SEATS)
                    .isActive(true)
                    .build());

            com.autowash.backend.employee.dto.EmployeeBookingCreateRequestDTO request =
                    com.autowash.backend.employee.dto.EmployeeBookingCreateRequestDTO.builder()
                            .customerId(existingCustomer.getCustomerId())
                            .licensePlate("EXIST-01")
                            .brand("Honda")
                            .model("Civic")
                            .vehicleType("4_seats")
                            .slotId(testSlot.getSlotId())
                            .details(List.of(
                                    new com.autowash.backend.employee.dto
                                            .EmployeeBookingCreateRequestDTO
                                            .ServiceItem(
                                            testService.getServiceId(), 1)
                            ))
                            .build();

            com.autowash.backend.employee.dto.EmployeeQueueBookingResponseDTO response =
                    employeeService.createBookingForCustomer(
                            employeeUser.getId(), request);

            assertNotNull(response);
            assertFalse(response.getAccountCreated(),
                    "Existing customer should NOT have accountCreated flag");
        }

        @Test
        @DisplayName("Employee booking with blank guest name is rejected")
        void employeeWalkInRejectsBlankGuestName() {
            com.autowash.backend.employee.dto.EmployeeBookingCreateRequestDTO request =
                    com.autowash.backend.employee.dto.EmployeeBookingCreateRequestDTO.builder()
                            .guestName("")
                            .guestPhone("0912345678")
                            .initialPassword("pass@123")
                            .licensePlate("INVALID-01")
                            .brand("Honda")
                            .vehicleType("4_seats")
                            .slotId(testSlot.getSlotId())
                            .details(List.of(
                                    new com.autowash.backend.employee.dto
                                            .EmployeeBookingCreateRequestDTO
                                            .ServiceItem(
                                            testService.getServiceId(), 1)
                            ))
                            .build();

            assertThrows(BusinessException.class,
                    () -> employeeService.createBookingForCustomer(
                            employeeUser.getId(), request));
        }
    }

    @Nested
    @DisplayName("Employee wash lifecycle — confirm → check-in → start wash → complete")
    class EmployeeWashLifecycleAcceptance {

        private Branch testBranch;
        private WashBay testWashBay;
        private TimeSlot testSlot;
        private ServicePackage testService;
        private User customerUser;
        private Customer testCustomer;
        private Vehicle testVehicle;
        private User employeeUser;
        private Employee testEmployee;
        private Booking booking;

        @BeforeEach
        void setUp() {
            testBranch = branchRepository.save(Branch.builder()
                    .branchName("CN Lifecycle Test")
                    .address("202 Lifecycle Street")
                    .phone("02899990009")
                    .capacity(2)
                    .status(Branch.BranchStatus.active)
                    .build());

            testWashBay = washBayRepository.save(WashBay.builder()
                    .branch(testBranch)
                    .bayName("Khoang Lifecycle")
                    .status(WashBay.BayStatus.available)
                    .capacity(1)
                    .build());

            testSlot = timeSlotRepository.save(TimeSlot.builder()
                    .branch(testBranch).washBay(testWashBay)
                    .slotDate(LocalDate.now().plusDays(1))
                    .startTime(LocalTime.of(10, 0))
                    .endTime(LocalTime.of(11, 0))
                    .maxCapacity(2).currentBookings(0)
                    .status(TimeSlot.SlotStatus.open)
                    .build());

            testService = servicePackageRepository.save(ServicePackage.builder()
                    .serviceName("Rửa xe Lifecycle")
                    .basePrice(new BigDecimal("100000"))
                    .isActive(true)
                    .build());

            customerUser = userRepository.save(User.builder()
                    .username("customer_life_" + System.currentTimeMillis())
                    .password(passwordEncoder.encode("test@123"))
                    .phone("0988777010")
                    .email("customer_life@test.com")
                    .role("customer")
                    .status("active")
                    .build());

            LoyaltyTier memberTier = loyaltyTierRepository.findById(1)
                    .orElseGet(() -> loyaltyTierRepository.save(LoyaltyTier.builder()
                            .tierId(1).tierName("Member").bookingWindowDays(7)
                            .minPoints(0).minVisits(0).minSpending(BigDecimal.ZERO)
                            .priorityLevel(0).isActive(true).build()));

            testCustomer = customerRepository.save(Customer.builder()
                    .user(customerUser)
                    .fullName("Nguyễn Văn Lifecycle")
                    .phone("0988777010")
                    .tierId(memberTier.getTierId())
                    .totalPoints(0).totalVisits(0).totalSpending(BigDecimal.ZERO)
                    .build());

            testVehicle = vehicleRepository.save(Vehicle.builder()
                    .customer(testCustomer)
                    .licensePlate("LIFECYCLE-01")
                    .brand("Toyota").model("Vios")
                    .vehicleType(Vehicle.VehicleType.FOUR_SEATS)
                    .isActive(true)
                    .build());

            employeeUser = userRepository.save(User.builder()
                    .username("employee_life_" + System.currentTimeMillis())
                    .password(passwordEncoder.encode("emp@123"))
                    .phone("0988777011")
                    .email("emp_life@test.com")
                    .role("employee")
                    .status("active")
                    .build());

            testEmployee = employeeRepository.save(Employee.builder()
                    .user(employeeUser)
                    .branch(testBranch)
                    .fullName("Nhân viên Lifecycle")
                    .phone("0988777011")
                    .role(Employee.StaffRole.supervisor)
                    .status(Employee.StaffStatus.active)
                    .build());

            BookingCreateRequestDTO request = new BookingCreateRequestDTO();
            request.setCustomerId(testCustomer.getCustomerId());
            request.setLicensePlate(testVehicle.getLicensePlate());
            request.setBrand("Toyota");
            request.setVehicleType("4_seats");
            request.setSlotId(testSlot.getSlotId());
            request.setBranchId(testBranch.getBranchId());
            request.setDetails(List.of(
                    BookingCreateRequestDTO.BookingDetailItem.builder()
                            .serviceId(testService.getServiceId())
                            .quantity(1).build()
            ));

            BookingCreateResponseDTO created = bookingService.createBooking(
                    request, customerUser.getId());
            booking = bookingRepository.findByBookingCode(
                    created.getBookingCode()).orElseThrow();
        }

        @Test
        @DisplayName("Full wash flow: pending → confirmed → checked_in → in_progress → completed")
        void fullWashFlowSucceeds() {
            assertEquals(BookingStatus.pending, booking.getStatus());

            var confirmed = employeeService.confirmBooking(
                    employeeUser.getId(), booking.getBookingId());
            assertEquals(BookingStatus.confirmed, confirmed.getStatus());

            var checkedIn = employeeService.checkInBooking(
                    employeeUser.getId(), booking.getBookingId());
            assertEquals(BookingStatus.checked_in, checkedIn.getStatus());

            var inProgress = employeeService.startWash(
                    employeeUser.getId(), booking.getBookingId(),
                    testWashBay.getBayId());
            assertEquals(BookingStatus.in_progress, inProgress.getStatus());

            var completed = employeeService.completeWash(
                    employeeUser.getId(), booking.getBookingId());
            assertEquals(BookingStatus.completed, completed.getStatus());

            WashBay bay = washBayRepository.findById(
                    testWashBay.getBayId()).get();
            assertEquals(WashBay.BayStatus.available, bay.getStatus(),
                    "Wash bay should be released after completion");
        }

        @Test
        @DisplayName("Cannot confirm an already confirmed booking")
        void cannotConfirmTwice() {
            employeeService.confirmBooking(
                    employeeUser.getId(), booking.getBookingId());

            assertThrows(BusinessException.class,
                    () -> employeeService.confirmBooking(
                            employeeUser.getId(), booking.getBookingId()));
        }

        @Test
        @DisplayName("Cannot start wash before check-in")
        void cannotStartWashBeforeCheckIn() {
            employeeService.confirmBooking(
                    employeeUser.getId(), booking.getBookingId());

            BusinessException exception = assertThrows(BusinessException.class,
                    () -> employeeService.startWash(
                            employeeUser.getId(), booking.getBookingId(),
                            testWashBay.getBayId()));
            assertTrue(exception.getMessage().contains("bắt đầu rửa"));
        }

        @Test
        @DisplayName("Cannot complete wash before starting")
        void cannotCompleteBeforeStartWash() {
            employeeService.confirmBooking(
                    employeeUser.getId(), booking.getBookingId());

            BusinessException exception = assertThrows(BusinessException.class,
                    () -> employeeService.completeWash(
                            employeeUser.getId(), booking.getBookingId()));
            assertTrue(exception.getMessage().contains("hoàn thành"));
        }
    }
}
