package com.autowash.backend;

import com.autowash.backend.booking.dto.BookingCreateRequestDTO;
import com.autowash.backend.booking.dto.BookingCreateResponseDTO;
import com.autowash.backend.booking.dto.BookingResponseDTO;
import com.autowash.backend.booking.entity.Booking;
import com.autowash.backend.booking.enums.BookingStatus;
import com.autowash.backend.booking.repository.BookingRepository;
import com.autowash.backend.booking.scheduler.BookingOverdueScheduler;
import com.autowash.backend.booking.service.BookingService;
import com.autowash.backend.branch.entity.Branch;
import com.autowash.backend.branch.repository.BranchRepository;
import com.autowash.backend.common.entity.AuditLog;
import com.autowash.backend.common.exception.BusinessException;
import com.autowash.backend.common.repository.AuditLogRepository;
import com.autowash.backend.customer.entity.Customer;
import com.autowash.backend.customer.repository.CustomerRepository;
import com.autowash.backend.loyaltytransaction.entity.LoyaltyTransaction;
import com.autowash.backend.loyaltytransaction.repository.LoyaltyTransactionRepository;
import com.autowash.backend.loyaltytransaction.scheduler.LoyaltyExpirationScheduler;
import com.autowash.backend.payment.entity.Payment;
import com.autowash.backend.payment.repository.PaymentRepository;
import com.autowash.backend.servicepackage.entity.ServicePackage;
import com.autowash.backend.servicepackage.repository.ServicePackageRepository;
import com.autowash.backend.timeslot.entity.TimeSlot;
import com.autowash.backend.timeslot.repository.TimeSlotRepository;
import com.autowash.backend.user.entity.User;
import com.autowash.backend.user.repository.UserRepository;
import com.autowash.backend.vehicle.entity.Vehicle;
import com.autowash.backend.washbay.entity.WashBay;
import com.autowash.backend.washbay.repository.WashBayRepository;
import com.autowash.backend.vehicle.repository.VehicleRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import jakarta.persistence.EntityManager;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
@DisplayName("Kiểm Thử Chấp Nhận (Acceptance Testing) Cho 10 Quy Tắc Nghiệp Vụ Business Rules")
class BusinessRulesAcceptanceTest {

    @Autowired private BookingService bookingService;
    @Autowired private BookingRepository bookingRepository;
    @Autowired private PaymentRepository paymentRepository;
    @Autowired private CustomerRepository customerRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private VehicleRepository vehicleRepository;
    @Autowired private BranchRepository branchRepository;
    @Autowired private TimeSlotRepository timeSlotRepository;
    @Autowired private ServicePackageRepository servicePackageRepository;
    @Autowired private LoyaltyTransactionRepository loyaltyTransactionRepository;
    @Autowired private LoyaltyExpirationScheduler loyaltyExpirationScheduler;
    @Autowired private WashBayRepository washBayRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private EntityManager entityManager;
    @Autowired private BookingOverdueScheduler bookingOverdueScheduler;
    @Autowired private AuditLogRepository auditLogRepository;
    @Autowired private JdbcTemplate jdbcTemplate;

    private User testUser;
    private Customer testCustomer;
    private Vehicle testVehicle;
    private Branch testBranch;
    private WashBay testWashBay;
    private ServicePackage testPackage;
    private User testAdminUser;

    @BeforeEach
    void setUp() {
        testUser = userRepository.save(User.builder()
                .username("acceptance_user_" + System.currentTimeMillis())
                .password(passwordEncoder.encode("password123"))
                .email("acceptance_" + System.currentTimeMillis() + "@test.com")
                .phone("090" + (System.currentTimeMillis() % 10000000))
                .role("customer")
                .status("active")
                .build());

        testAdminUser = userRepository.save(User.builder()
                .username("admin_acceptance_" + System.currentTimeMillis())
                .password(passwordEncoder.encode("password123"))
                .email("admin_acceptance_" + System.currentTimeMillis() + "@test.com")
                .phone("091" + (System.currentTimeMillis() % 10000000))
                .role("admin")
                .status("active")
                .build());

        testCustomer = customerRepository.save(Customer.builder()
                .user(testUser)
                .fullName("Nguyễn Văn Acceptance")
                .totalPoints(100)
                .build());

        testVehicle = vehicleRepository.save(Vehicle.builder()
                .customer(testCustomer)
                .licensePlate("29A-" + (System.currentTimeMillis() % 100000))
                .brand("Toyota")
                .model("Camry")
                .vehicleType(Vehicle.VehicleType.FOUR_SEATS)
                .build());

        testBranch = branchRepository.save(Branch.builder()
                .branchName("Chi Nhánh Acceptance Test " + System.currentTimeMillis())
                .address("123 Đường Test")
                .phone("0243999888")
                .capacity(5)
                .build());

        testWashBay = washBayRepository.save(WashBay.builder()
                .branch(testBranch)
                .bayName("Bay AT-1")
                .status(WashBay.BayStatus.available)
                .capacity(1)
                .build());

        testPackage = servicePackageRepository.save(ServicePackage.builder()
                .serviceName("Gói Rửa Chấp Nhận Test " + System.currentTimeMillis())
                .description("Mô tả gói test")
                .basePrice(BigDecimal.valueOf(150000))
                .durationMinutes(45)
                .isActive(true)
                .build());
    }

    @Nested
    @DisplayName("BR-14: Hủy / Đổi lịch trước mốc 1 tiếng")
    class BR14AcceptanceTest {

        @Test
        @DisplayName("GIVEN Lịch hẹn còn 30 phút WHEN Khách tự hủy THEN Bị từ chối với lỗi BAD_REQUEST")
        void customerCannotCancelLessThan1HourBefore() {
            // Dùng LocalDateTime.now().plusMinutes(30) để tránh midnight boundary bug
            LocalDateTime nearFuture = LocalDateTime.now().plusMinutes(30);
            TimeSlot slot = timeSlotRepository.save(TimeSlot.builder()
                    .branch(testBranch)
                    .washBay(testWashBay)
                    .slotDate(nearFuture.toLocalDate())
                    .startTime(nearFuture.toLocalTime())
                    .endTime(nearFuture.plusMinutes(60).toLocalTime())
                    .maxCapacity(5)
                    .currentBookings(1)
                    .status(TimeSlot.SlotStatus.open)
                    .build());

            Booking booking = bookingRepository.save(Booking.builder()
                    .customer(testCustomer)
                    .vehicle(testVehicle)
                    .branch(testBranch)
                    .slot(slot)
                    .bookingCode("BK-BR14-30M")
                    .status(BookingStatus.pending)
                    .build());

            BusinessException exception = assertThrows(
                    BusinessException.class,
                    () -> bookingService.cancelOwnBooking(booking.getBookingId(), testUser.getId())
            );

            assertEquals(HttpStatus.BAD_REQUEST, exception.getHttpStatus());
            assertTrue(exception.getMessage().matches(".*trước tối thiểu \\d+ tiếng.*"));
        }

        @Test
        @DisplayName("GIVEN Lịch hẹn còn > 24 tiếng WHEN Khách tự hủy THEN Hủy thành công")
        void customerCanCancelMoreThan1HourBefore() {
            TimeSlot slot = timeSlotRepository.save(TimeSlot.builder()
                    .branch(testBranch)
                    .washBay(testWashBay)
                    .slotDate(LocalDate.now().plusDays(2))
                    .startTime(LocalTime.of(14, 0))
                    .endTime(LocalTime.of(15, 0))
                    .maxCapacity(5)
                    .currentBookings(1)
                    .status(TimeSlot.SlotStatus.open)
                    .build());

            Booking booking = bookingRepository.save(Booking.builder()
                    .customer(testCustomer)
                    .vehicle(testVehicle)
                    .branch(testBranch)
                    .slot(slot)
                    .bookingCode("BK-BR14-2D")
                    .status(BookingStatus.pending)
                    .build());

            BookingResponseDTO response = bookingService.cancelOwnBooking(booking.getBookingId(), testUser.getId());

            assertNotNull(response);
            assertEquals(BookingStatus.cancelled, response.getStatus());
        }

        @Test
        @DisplayName("GIVEN Lịch hẹn còn 15 phút WHEN Admin/Staff hủy THEN Hủy thành công (Không bị hạn chế 1h)")
        void adminCanCancelAnytime() {
            TimeSlot slot = timeSlotRepository.save(TimeSlot.builder()
                    .branch(testBranch)
                    .washBay(testWashBay)
                    .slotDate(LocalDate.now())
                    .startTime(LocalTime.now().plusMinutes(15))
                    .endTime(LocalTime.now().plusMinutes(75))
                    .maxCapacity(5)
                    .currentBookings(1)
                    .status(TimeSlot.SlotStatus.open)
                    .build());

            Booking booking = bookingRepository.save(Booking.builder()
                    .customer(testCustomer)
                    .vehicle(testVehicle)
                    .branch(testBranch)
                    .slot(slot)
                    .bookingCode("BK-BR14-ADMIN")
                    .status(BookingStatus.pending)
                    .build());

            BookingResponseDTO response = bookingService.cancelBooking(booking.getBookingId(), testAdminUser.getId());

            assertNotNull(response);
            assertEquals(BookingStatus.cancelled, response.getStatus());
        }
    }

    @Nested
    @DisplayName("BR-101: Tự động khởi tạo Payment Record")
    class BR101AcceptanceTest {

        @Test
        @DisplayName("WHEN Khách tạo booking mới THEN Payment record tự động được tạo với status 'unpaid' và method 'cash'")
        void autoCreatePaymentRecordOnBookingCreation() {
            TimeSlot slot = timeSlotRepository.save(TimeSlot.builder()
                    .branch(testBranch)
                    .washBay(testWashBay)
                    .slotDate(LocalDate.now().plusDays(2))
                    .startTime(LocalTime.of(10, 0))
                    .endTime(LocalTime.of(11, 0))
                    .maxCapacity(5)
                    .currentBookings(0)
                    .status(TimeSlot.SlotStatus.open)
                    .build());

            BookingCreateRequestDTO request = new BookingCreateRequestDTO();
            request.setCustomerId(testCustomer.getCustomerId());
            request.setLicensePlate(testVehicle.getLicensePlate());
            request.setBrand(testVehicle.getBrand());
            request.setVehicleType("4_seats");
            request.setBranchId(testBranch.getBranchId());
            request.setSlotId(slot.getSlotId());
            request.setDetails(List.of(
                    BookingCreateRequestDTO.BookingDetailItem.builder()
                            .serviceId(testPackage.getServiceId())
                            .quantity(1)
                            .build()
            ));

            BookingCreateResponseDTO response = bookingService.createBooking(request, testUser.getId());

            assertNotNull(response);
            assertNotNull(response.getBookingId());

            Payment payment = paymentRepository.findByBooking_BookingId(response.getBookingId())
                    .orElse(null);

            assertNotNull(payment, "Payment record phải tự động được khởi tạo theo BR-101");
            assertEquals(Payment.PaymentStatus.unpaid, payment.getPaymentStatus());
            assertEquals(Payment.PaymentMethod.cash, payment.getPaymentMethod());
            assertNotNull(payment.getOriginalAmount());
            assertNotNull(payment.getFinalAmount());
            assertEquals(BigDecimal.ZERO, payment.getDiscountAmount());
        }
    }

    @Nested
    @DisplayName("BR-15: Tự động hủy booking quá hạn 15 phút")
    class BR15AcceptanceTest {

        @Test
        @DisplayName("GIVEN Booking quá giờ hẹn 2 tiếng và chưa thanh toán WHEN Scheduler chạy THEN Booking bị hủy (BR-15)")
        void autoCancelOverdueUnpaidBooking() {
            TimeSlot slot = timeSlotRepository.save(TimeSlot.builder()
                    .branch(testBranch)
                    .washBay(testWashBay)
                    .slotDate(LocalDate.now())
                    .startTime(LocalTime.now().minusHours(2))
                    .endTime(LocalTime.now().plusHours(1))
                    .maxCapacity(5)
                    .currentBookings(1)
                    .status(TimeSlot.SlotStatus.open)
                    .build());

            Booking booking = bookingRepository.save(Booking.builder()
                    .customer(testCustomer)
                    .vehicle(testVehicle)
                    .branch(testBranch)
                    .slot(slot)
                    .bookingCode("BK-BR15-OVERDUE")
                    .status(BookingStatus.pending)
                    .build());

            entityManager.flush();

            // Kiểm tra điều kiện 15-phút-window dùng Java LocalTime (tránh timezone mismatch)
            LocalTime cutoff = LocalTime.now().minusMinutes(15);
            Integer slotOnly = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM time_slot WHERE slot_id = ? AND (slot_date < CURRENT_DATE OR (slot_date = CURRENT_DATE AND start_time < ?))",
                    Integer.class, slot.getSlotId(), cutoff);
            Integer bookingOnly = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM booking WHERE booking_id = ? AND status IN ('pending','confirmed')",
                    Integer.class, booking.getBookingId());
            Integer slotIdInDb = jdbcTemplate.queryForObject(
                    "SELECT slot_id FROM booking WHERE booking_id = ?", Integer.class, booking.getBookingId());
            assertEquals(1, slotOnly, "Điều kiện time_slot thất bại: start=" + slot.getStartTime() + " cutoff=" + cutoff);
            assertEquals(1, bookingOnly, "Booking không ở trạng thái pending");
            assertEquals(slot.getSlotId(), slotIdInDb, "slot_id không khớp");

            // Gọi scheduler để kiểm tra native SQL 15-phút-window
            bookingOverdueScheduler.autoCancelExpiredPastBookings();

            String status = jdbcTemplate.queryForObject(
                    "SELECT status FROM booking WHERE booking_id = ?",
                    String.class, booking.getBookingId());
            assertEquals("cancelled", status,
                    "Booking quá hạn 2 tiếng không có payment phải bị hủy (BR-15)");
        }
    }

    @Nested
    @DisplayName("BR-19: Hết hạn điểm thưởng 12 tháng & Idempotency")
    class BR19AcceptanceTest {

        @Test
        @DisplayName("GIVEN Giao dịch tích điểm hết hạn (>12 tháng) WHEN LoyaltyExpirationScheduler chạy THEN Trừ điểm đúng và không trừ lặp")
        void expireLoyaltyPointsWithIdempotencyGuard() {
            int initialPoints = testCustomer.getTotalPoints();
            int pointsEarned = 50;

            LoyaltyTransaction earnTx = loyaltyTransactionRepository.save(LoyaltyTransaction.builder()
                    .customerId(testCustomer.getCustomerId())
                    .transactionType("earn")
                    .points(pointsEarned)
                    .balanceBefore(initialPoints)
                    .balanceAfter(initialPoints + pointsEarned)
                    .expiredAt(LocalDateTime.now().minusDays(1)) // Đã hết hạn
                    .createdAt(LocalDateTime.now().minusMonths(13))
                    .note("Giao dịch test hết hạn")
                    .build());

            testCustomer.setTotalPoints(initialPoints + pointsEarned);
            customerRepository.saveAndFlush(testCustomer);
            entityManager.clear();

            // Chạy scheduler lần 1
            loyaltyExpirationScheduler.processExpiredLoyaltyPoints();
            entityManager.flush();
            entityManager.clear();

            Customer updatedCustomer = customerRepository.findById(testCustomer.getCustomerId()).orElseThrow();
            assertEquals(initialPoints, updatedCustomer.getTotalPoints(), "Điểm tổng của khách hàng phải bị trừ 50 điểm hết hạn");

            List<LoyaltyTransaction> expiredTxs = loyaltyTransactionRepository
                    .findByCustomerIdAndTransactionType(testCustomer.getCustomerId(), "expired");
            assertEquals(1, expiredTxs.size());
            assertEquals(-50, expiredTxs.get(0).getPoints());

            // Chạy scheduler lần 2 để kiểm tra Idempotency Guard (Không trừ lặp)
            loyaltyExpirationScheduler.processExpiredLoyaltyPoints();
            entityManager.flush();
            entityManager.clear();

            Customer reCheckedCustomer = customerRepository.findById(testCustomer.getCustomerId()).orElseThrow();
            assertEquals(initialPoints, reCheckedCustomer.getTotalPoints(), "Số điểm không được bị trừ lần 2 do Idempotency Guard");

            List<LoyaltyTransaction> reCheckedExpiredTxs = loyaltyTransactionRepository
                    .findByCustomerIdAndTransactionType(testCustomer.getCustomerId(), "expired");
            assertEquals(1, reCheckedExpiredTxs.size(), "Không tạo thêm giao dịch hết hạn trùng lặp");

            // BR-35: Kiểm tra audit log được tạo khi điểm hết hạn
            List<AuditLog> auditLogs = auditLogRepository.findAllByOrderByTimestampDesc();
            boolean pointsExpiredLogFound = auditLogs.stream()
                    .anyMatch(log -> "POINTS_EXPIRED".equals(log.getAction())
                            && testUser.getId().equals(log.getTargetUserId())
                            && log.getDetails() != null && log.getDetails().contains("Hết hạn"));
            assertTrue(pointsExpiredLogFound, "Phải có audit log POINTS_EXPIRED ghi lại việc hết hạn điểm (BR-35)");
        }
    }
}
