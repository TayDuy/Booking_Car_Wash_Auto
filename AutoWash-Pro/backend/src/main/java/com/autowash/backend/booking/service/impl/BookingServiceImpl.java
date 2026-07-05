package com.autowash.backend.booking.service.impl;

import com.autowash.backend.booking.dto.*;
import com.autowash.backend.booking.entity.Booking;
import com.autowash.backend.booking.enums.BookingStatus;
import com.autowash.backend.booking.entity.BookingDetail;
import com.autowash.backend.booking.mapper.BookingMapper;
import com.autowash.backend.booking.repository.BookingDetailRepository;
import com.autowash.backend.booking.repository.BookingRepository;
import com.autowash.backend.booking.service.BookingService;
import com.autowash.backend.branch.entity.Branch;
import com.autowash.backend.branch.repository.BranchRepository;
import com.autowash.backend.common.exception.BusinessException;
import com.autowash.backend.common.exception.ResourceNotFoundException;
import com.autowash.backend.customer.entity.Customer;
import com.autowash.backend.customer.repository.CustomerRepository;
import com.autowash.backend.employee.entity.Employee;
import com.autowash.backend.employee.repository.EmployeeRepository;
import com.autowash.backend.loyaltytransaction.dto.LoyaltyBalanceResponseDTO;
import com.autowash.backend.loyaltytransaction.service.LoyaltyTransactionService;
import com.autowash.backend.servicepackage.entity.ServicePackage;
import com.autowash.backend.servicepackage.repository.ServicePackageRepository;
import com.autowash.backend.serviceprice.service.ServicePriceService;
import com.autowash.backend.timeslot.entity.TimeSlot;
import com.autowash.backend.timeslot.repository.TimeSlotRepository;
import com.autowash.backend.vehicle.entity.Vehicle;
import com.autowash.backend.vehicle.repository.VehicleRepository;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@lombok.extern.slf4j.Slf4j
public class BookingServiceImpl implements BookingService {

    private final BookingRepository bookingRepository;
    private final BookingDetailRepository bookingDetailRepository;
    private final CustomerRepository customerRepository;
    private final VehicleRepository vehicleRepository;
    private final TimeSlotRepository timeSlotRepository;
    private final BranchRepository branchRepository;
    private final EmployeeRepository employeeRepository;
    private final ServicePackageRepository servicePackageRepository;
    private final BookingMapper bookingMapper;
    private final LoyaltyTransactionService loyaltyTransactionService;
    private final ServicePriceService servicePriceService;

    // ── CREATE ──────────────────────────────────────────────────────────────

    /**
     * Tạo booking mới.
     * Luồng: validate entities → build details → lock slot → save booking.
     *
     * FIX race condition:
     *   Trước đây dùng findById() thông thường → 2 request đồng thời cùng đọc
     *   slot còn chỗ → cùng vượt qua hasCapacity() → overbooking.
     *
     *   Sau khi fix dùng findByIdForUpdate() với PESSIMISTIC_WRITE:
     *   → DB thực thi SELECT ... FOR UPDATE, lock hàng time_slot ngay lúc đọc.
     *   → Request thứ 2 bị chặn ở DB cho đến khi request thứ 1 commit xong.
     *   → Request thứ 2 đọc lại currentBookings đã tăng → hasCapacity() = false
     *   → Ném lỗi "Slot đã đầy" đúng cách, không còn overbooking.
     *
     * FIX exception handling (2026-06-25):
     *   Trước đây toàn bộ orElseThrow/validate dùng RuntimeException trần
     *   → GlobalExceptionHandler không có handler riêng cho RuntimeException
     *   → rơi vào handleGenericException() (catch-all Exception.class)
     *   → log "Unhandled exception" + trả về HTTP 500 cho TẤT CẢ lỗi,
     *     kể cả lỗi nghiệp vụ bình thường như "hết slot", "không tìm thấy".
     *
     *   Sau khi fix:
     *   - Không tìm thấy resource (customer/vehicle/slot/branch/service)
     *     → ResourceNotFoundException → GlobalExceptionHandler trả 404.
     *   - Lỗi nghiệp vụ thực sự (hết slot) → BusinessException(HttpStatus, message)
     *     → GlobalExceptionHandler trả đúng status do mình chỉ định (409 Conflict).
     *   → Frontend nhận được status code + message rõ ràng để hiển thị cho user,
     *     không còn bị che bởi message generic "Đã xảy ra lỗi hệ thống".
     */
    @Override
    @Transactional
    public BookingCreateResponseDTO createBooking(BookingCreateRequestDTO request, Integer userId) {
        if (userId != null) {
            Customer authenticatedCustomer = customerRepository.findByUser_Id(userId)
                    .orElseThrow(() -> new BusinessException("Không tìm thấy khách hàng ứng với tài khoản đăng nhập", HttpStatus.FORBIDDEN));
            if (!authenticatedCustomer.getCustomerId().equals(request.getCustomerId())) {
                throw new BusinessException("Bạn không thể tạo đặt lịch dưới danh nghĩa của khách hàng khác", HttpStatus.FORBIDDEN);
            }
        }

        Customer customer = customerRepository.findById(request.getCustomerId())
                .orElseThrow(() -> new ResourceNotFoundException("Customer", "id", request.getCustomerId()));

        // ← Thay vehicleRepository.findById bằng logic check biển số
        String normalizedPlate = request.getLicensePlate().trim().toUpperCase();
        Vehicle vehicle = vehicleRepository.findByLicensePlateAndCustomer_CustomerId(normalizedPlate, customer.getCustomerId())
                .map(existing -> {
                    // Xe đã có sẵn của đúng customer này -> kích hoạt lại nếu trước đó bị soft-delete
                    if (!Boolean.TRUE.equals(existing.getIsActive())) {
                        existing.setIsActive(true);
                        return vehicleRepository.save(existing);
                    }
                    return existing;
                })
                .orElseGet(() -> {
                    // Không tìm thấy xe của customer này với biển số đó -> tạo mới
                    // (kể cả khi biển số đã tồn tại dưới customer khác, vì 1 xe
                    //  thực tế có thể đổi chủ / được nhiều khách nhập nhầm)
                    Vehicle newVehicle = Vehicle.builder()
                            .customer(customer)
                            .licensePlate(normalizedPlate)
                            .brand(request.getBrand())
                            .model(request.getModel())
                            .vehicleType(resolveVehicleType(request.getVehicleType()))
                            .isActive(true)
                            .build();
                    return vehicleRepository.save(newVehicle);
                });

        TimeSlot slot = timeSlotRepository.findByIdForUpdate(request.getSlotId())
                .orElseThrow(() -> new ResourceNotFoundException("TimeSlot", "id", request.getSlotId()));

        if (!slot.hasCapacity()) {
            throw new BusinessException("Slot đã đầy, vui lòng chọn khung giờ khác", HttpStatus.CONFLICT);
        }

        Branch branch = branchRepository.findById(request.getBranchId())
                .orElseThrow(() -> new ResourceNotFoundException("Branch", "id", request.getBranchId()));

        String priceVehicleType = resolvePriceVehicleType(request.getVehicleType());

        List<BookingDetail> details = new ArrayList<>();
        for (BookingCreateRequestDTO.BookingDetailItem item : request.getDetails()) {
            ServicePackage servicePackage = servicePackageRepository.findById(item.getServiceId())
                    .orElseThrow(() -> new ResourceNotFoundException("ServicePackage", "id", item.getServiceId()));

            BigDecimal unitPrice = servicePriceService.getActivePrice(
                    item.getServiceId(),
                    priceVehicleType
            );
            BigDecimal subTotal = unitPrice.multiply(BigDecimal.valueOf(item.getQuantity()));

            details.add(BookingDetail.builder()
                    .service(servicePackage)
                    .quantity(item.getQuantity())
                    .unitPrice(unitPrice)
                    .subTotal(subTotal)
                    .build());
        }

        slot.incrementBookings();
        timeSlotRepository.save(slot);

        Booking booking = Booking.builder()
                .customer(customer)
                .vehicle(vehicle)
                .slot(slot)
                .branch(branch)
                .bookingCode(generateBookingCode())
                .status(BookingStatus.pending)
                .priorityScore(resolvePriorityScore(customer))
                .note(request.getNote())
                .startTime(LocalDateTime.of(slot.getSlotDate(), slot.getStartTime()))
                .endTime(LocalDateTime.of(slot.getSlotDate(), slot.getEndTime()))
                .build();

        Booking savedBooking = bookingRepository.save(booking);
        details.forEach(d -> d.setBooking(savedBooking));
        bookingDetailRepository.saveAll(details);
        return bookingMapper.toCreateResponse(savedBooking, details);
    }

    private String resolvePriceVehicleType(String vehicleType) {
        if (vehicleType == null || vehicleType.isBlank()) {
            throw new BusinessException(
                    "Loại xe không được để trống",
                    HttpStatus.BAD_REQUEST
            );
        }
        return switch (vehicleType.trim().toLowerCase()) {
            case "4_seats", "4", "4 chỗ", "4 cho" -> "4_seats";
            case "7_seats", "7", "7 chỗ", "7 cho" -> "7_seats";
            case "16_seats", "16", "16 chỗ", "16 cho" -> "16_seats";

            default -> throw new BusinessException(
                    "Loại xe không hợp lệ. Chỉ hỗ trợ 4_seats, 7_seats, 16_seats",
                    HttpStatus.BAD_REQUEST
            );
        };
    }
    // ── READ ─────────────────────────────────────────────────────────────────

    /** Lấy chi tiết một booking theo ID. */
    @Override
    @Transactional(readOnly = true)
    public BookingResponseDTO getBookingById(Integer bookingId, Integer userId) {
        Booking booking = findBookingOrThrow(bookingId);
        if (userId != null) {
            Customer customer = customerRepository.findByUser_Id(userId)
                    .orElseThrow(() -> new BusinessException("Không tìm thấy khách hàng", HttpStatus.FORBIDDEN));
            if (!booking.getCustomer().getCustomerId().equals(customer.getCustomerId())) {
                throw new BusinessException("Bạn không có quyền truy cập lịch đặt này", HttpStatus.FORBIDDEN);
            }
        }
        List<BookingDetail> details = bookingDetailRepository.findByBooking(booking);
        return bookingMapper.toResponse(booking, details);
    }

    /** Lấy danh sách tóm tắt tất cả booking. */
    @Override
    @Transactional(readOnly = true)
    public List<BookingSummaryResponseDTO> getAllBookings() {
        List<Booking> bookings = bookingRepository.findAllWithAssociations();
        return mapToSummaryResponses(bookings);
    }

    /** Lấy danh sách booking theo customer, sắp xếp mới nhất trước. */
    @Override
    @Transactional(readOnly = true)
    public List<BookingSummaryResponseDTO> getBookingsByCustomer(Integer customerId, Integer userId) {
        return getBookingsByCustomer(customerId, userId, null);
    }

    /** Lấy danh sách booking theo customer + status, sắp xếp mới nhất trước. */
    @Override
    @Transactional(readOnly = true)
    public List<BookingSummaryResponseDTO> getBookingsByCustomer(Integer customerId, Integer userId, String status) {
        if (userId != null) {
            Customer customer = customerRepository.findByUser_Id(userId)
                    .orElseThrow(() -> new BusinessException("Không tìm thấy khách hàng", HttpStatus.FORBIDDEN));
            if (!customer.getCustomerId().equals(customerId)) {
                throw new BusinessException("Bạn không có quyền truy cập danh sách đặt lịch này", HttpStatus.FORBIDDEN);
            }
        }
        List<Booking> bookings;
        if (status != null && !status.isBlank()) {
            try {
                BookingStatus bookingStatus = BookingStatus.valueOf(status);
                bookings = bookingRepository.findByCustomerWithAssociationsAndStatus(customerId, bookingStatus);
            } catch (IllegalArgumentException e) {
                throw new BusinessException("Trạng thái không hợp lệ: " + status, HttpStatus.BAD_REQUEST);
            }
        } else {
            bookings = bookingRepository.findByCustomerWithAssociations(customerId);
        }
        return mapToSummaryResponses(bookings);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BookingSummaryResponseDTO> getMyBookings(Integer userId, String status) {
        Customer customer = customerRepository.findByUser_Id(userId)
                .orElseThrow(() -> new BusinessException("Không tìm thấy hồ sơ khách hàng", HttpStatus.NOT_FOUND));
        return getBookingsByCustomer(customer.getCustomerId(), userId, status);
    }

    private List<BookingSummaryResponseDTO> mapToSummaryResponses(List<Booking> bookings) {
        if (bookings.isEmpty()) {
            return Collections.emptyList();
        }
        List<Integer> bookingIds = bookings.stream().map(Booking::getBookingId).toList();
        List<BookingDetail> details = bookingDetailRepository.findByBooking_BookingIdIn(bookingIds);
        Map<Integer, List<BookingDetail>> detailsMap = details.stream()
                .collect(Collectors.groupingBy(d -> d.getBooking().getBookingId()));

        return bookings.stream()
                .map(b -> bookingMapper.toSummaryResponse(b, detailsMap.getOrDefault(b.getBookingId(), Collections.emptyList())))
                .collect(Collectors.toList());
    }

    // ── UPDATE ───────────────────────────────────────────────────────────────

    /**
     * Cập nhật note và/hoặc nhân viên phụ trách.
     * Không cho phép thay đổi status hay thông tin booking qua endpoint này.
     */
    @Override
    @Transactional
    public BookingResponseDTO updateBooking(Integer bookingId, BookingUpdateRequestDTO request) {
        Booking booking = findBookingOrThrow(bookingId);

        if (request.getNote() != null) booking.setNote(request.getNote());

        if (request.getAssignedStaffId() != null) {
            // FIX: RuntimeException -> ResourceNotFoundException (404 thay vì 500)
            Employee employee = employeeRepository.findById(request.getAssignedStaffId())
                    .orElseThrow(() -> new ResourceNotFoundException("Employee", "id", request.getAssignedStaffId()));
            booking.setAssignedStaff(employee);
        }

        Booking saved = bookingRepository.save(booking);
        return bookingMapper.toResponse(saved, bookingDetailRepository.findByBooking(saved));
    }

    // ── STATUS TRANSITIONS ───────────────────────────────────────────────────

    /**
     * Hủy booking — giải phóng slot để người khác có thể đặt.
     *
     * FIX (chế độ hủy lịch): trước đây hàm này KHÔNG kiểm tra trạng thái hiện tại
     * của booking trước khi hủy — dù entity Booking đã có sẵn isCancellable()
     * (chỉ cho phép hủy khi đang pending/confirmed) nhưng service không hề gọi nó.
     * Hậu quả: có thể hủy 1 booking đã completed/cancelled/in_progress, và nếu hủy
     * trùng nhiều lần sẽ gọi decrementBookings() nhiều lần → sai lệch số chỗ trống
     * thật của slot so với dữ liệu.
     *
     * Dùng cho STAFF/ADMIN (hủy bất kỳ booking nào, không cần là chủ sở hữu).
     */
    @Override
    @Transactional
    public BookingResponseDTO cancelBooking(Integer bookingId, Integer userId) {
        Booking booking = findBookingOrThrow(bookingId);
        return doCancel(booking);
    }

    /**
     * CUSTOMER hủy booking của chính mình.
     *
     * FIX (chế độ hủy lịch): trước đây endpoint hủy của customer chỉ check
     * hasRole('CUSTOMER') mà KHÔNG kiểm tra bookingId đó có thuộc về khách
     * đang đăng nhập hay không → bất kỳ khách nào cũng có thể hủy lịch của
     * người khác nếu biết/đoán được bookingId. Giờ bắt buộc phải khớp customer.
     */
    @Override
    @Transactional
    public BookingResponseDTO cancelOwnBooking(Integer bookingId, Integer userId) {
        Booking booking = findBookingOrThrow(bookingId);

        Customer owner = customerRepository.findByUser_Id(userId)
                .orElseThrow(() -> new BusinessException("Không tìm thấy hồ sơ khách hàng", HttpStatus.NOT_FOUND));

        if (!booking.getCustomer().getCustomerId().equals(owner.getCustomerId())) {
            throw new BusinessException("Bạn không có quyền hủy lịch đặt này", HttpStatus.FORBIDDEN);
        }

        return doCancel(booking);
    }

    /** Logic hủy dùng chung cho cả 2 luồng — validate trạng thái trước khi hủy. */
    private BookingResponseDTO doCancel(Booking booking) {
        if (!booking.isCancellable()) {
            throw new BusinessException(
                    "Không thể hủy lịch đang ở trạng thái '" + booking.getStatus() +
                            "'. Chỉ có thể hủy khi đang chờ xác nhận (pending) hoặc đã xác nhận (confirmed).",
                    HttpStatus.CONFLICT);
        }
        booking.setStatus(BookingStatus.cancelled);

        // Giảm số lượng đặt trên slot để mở lại capacity
        // decrementBookings() trong entity tự chuyển status → open nếu còn chỗ
        TimeSlot slot = booking.getSlot();
        slot.decrementBookings();
        timeSlotRepository.save(slot);

        Booking saved = bookingRepository.save(booking);
        return bookingMapper.toResponse(saved, bookingDetailRepository.findByBooking(saved));
    }

    /**
     * Staff/Admin xác nhận booking: pending -> confirmed.
     */
    @Override
    @Transactional
    public BookingResponseDTO confirmBooking(Integer bookingId) {
        Booking booking = findBookingOrThrow(bookingId);

        if (!BookingStatus.pending.equals(booking.getStatus())) {
            throw new BusinessException("Chỉ booking pending mới được xác nhận", HttpStatus.BAD_REQUEST);
        }

        booking.setStatus(BookingStatus.confirmed);

        Booking saved = bookingRepository.save(booking);
        return bookingMapper.toResponse(saved, bookingDetailRepository.findByBooking(saved));
    }

    /**
     * Nhân viên check-in khi khách đã tới chi nhánh: confirmed -> in_progress.
     */
    @Override
    @Transactional
    public BookingResponseDTO checkInBooking(Integer bookingId) {
        Booking booking = findBookingOrThrow(bookingId);

        if (!BookingStatus.confirmed.equals(booking.getStatus())) {
            throw new BusinessException(
                    "Chỉ booking confirmed mới được check-in",
                    HttpStatus.BAD_REQUEST
            );
        }

        booking.setStatus(BookingStatus.in_progress);
        booking.setCheckInAt(LocalDateTime.now());

        Booking saved = bookingRepository.save(booking);
        return bookingMapper.toResponse(saved, bookingDetailRepository.findByBooking(saved));
    }

    /**
     * Hoàn thành booking: in_progress -> completed.
     * Đây là điểm trigger cộng loyalty point và đánh giá lại tier.
     */
    @Override
    @Transactional
    public BookingResponseDTO completeBooking(Integer bookingId) {
        Booking booking = findBookingOrThrow(bookingId);

        // FIX: RuntimeException -> BusinessException(BAD_REQUEST, ...)
        // → Đây là lỗi sai luồng nghiệp vụ (sai trạng thái), trả 400
        //   kèm message rõ ràng, thay vì 500 generic.
        if (!BookingStatus.in_progress.equals(booking.getStatus())) {
            throw new BusinessException(
                    "Chỉ booking in_progress mới được hoàn thành",
                    HttpStatus.BAD_REQUEST
            );
        }

        booking.setStatus(BookingStatus.completed);
        booking.setCompleteAt(LocalDateTime.now());

        grantLoyaltyPointIfNeeded(booking);

        Booking savedBooking = bookingRepository.save(booking);

        List<BookingDetail> details = bookingDetailRepository.findByBooking(savedBooking);

        return bookingMapper.toResponse(savedBooking, details);
    }
    /**
     * Chỉ cộng điểm một lần khi booking hoàn thaành.
     */

    private void grantLoyaltyPointIfNeeded(Booking booking) {
        if (Boolean.TRUE.equals(booking.getLoyaltyPointGranted())) {
            return;
        }

        List<BookingDetail> details = bookingDetailRepository.findByBooking(booking);

        BigDecimal totalAmount = details.stream()
                .map(detail -> detail.getSubTotal() == null
                        ? BigDecimal.ZERO
                        : detail.getSubTotal())
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        loyaltyTransactionService.earnPointsFromCompleteBooking(booking, totalAmount);

        updateCustomerLoyaltyStats(booking.getCustomer(), totalAmount);

        booking.setLoyaltyPointGranted(true);
    }

    private void updateCustomerLoyaltyStats(Customer customer, BigDecimal totalAmount) {
        Integer currentVisits = customer.getTotalVisits() != null
                ? customer.getTotalVisits()
                : 0;

        BigDecimal currentSpending = customer.getTotalSpending() != null
                ? customer.getTotalSpending()
                : BigDecimal.ZERO;

        customer.setTotalVisits(currentVisits + 1);
        customer.setTotalSpending(currentSpending.add(totalAmount));

        LoyaltyBalanceResponseDTO balance =
                loyaltyTransactionService.getCustomerBalance(customer.getCustomerId());

        customer.setTotalPoints(balance.getCurrentPoints());

        customerRepository.save(customer);
    }

    // ── RESCHEDULE ────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public BookingResponseDTO rescheduleBooking(Integer bookingId, Integer userId, BookingRescheduleRequestDTO request) {
        Booking booking = findBookingOrThrow(bookingId);

        Customer owner = customerRepository.findByUser_Id(userId)
                .orElseThrow(() -> new BusinessException("Không tìm thấy hồ sơ khách hàng", HttpStatus.NOT_FOUND));

        if (!booking.getCustomer().getCustomerId().equals(owner.getCustomerId())) {
            throw new BusinessException("Bạn không có quyền sửa lịch đặt này", HttpStatus.FORBIDDEN);
        }

        if (!BookingStatus.pending.equals(booking.getStatus())) {
            throw new BusinessException(
                    "Chỉ có thể thay đổi lịch đặt ở trạng thái pending. Hiện tại: " + booking.getStatus(),
                    HttpStatus.CONFLICT);
        }

        if (request.getNote() != null) {
            booking.setNote(request.getNote());
        }

        if (request.getNewSlotId() != null) {
            TimeSlot oldSlot = booking.getSlot();
            if (oldSlot.getSlotId().equals(request.getNewSlotId())) {
                throw new BusinessException("Khung giờ mới trùng với khung giờ hiện tại", HttpStatus.BAD_REQUEST);
            }

            oldSlot.decrementBookings();
            timeSlotRepository.save(oldSlot);

            TimeSlot newSlot = timeSlotRepository.findByIdForUpdate(request.getNewSlotId())
                    .orElseThrow(() -> new ResourceNotFoundException("TimeSlot", "id", request.getNewSlotId()));

            if (!newSlot.hasCapacity()) {
                throw new BusinessException("Slot mới đã đầy, vui lòng chọn khung giờ khác", HttpStatus.CONFLICT);
            }

            newSlot.incrementBookings();
            timeSlotRepository.save(newSlot);

            booking.setSlot(newSlot);
            booking.setBranch(newSlot.getBranch());
            booking.setStartTime(LocalDateTime.of(newSlot.getSlotDate(), newSlot.getStartTime()));
            booking.setEndTime(LocalDateTime.of(newSlot.getSlotDate(), newSlot.getEndTime()));
        }

        Booking saved = bookingRepository.save(booking);
        return bookingMapper.toResponse(saved, bookingDetailRepository.findByBooking(saved));
    }

    // ── HELPERS ──────────────────────────────────────────────────────────────

    /**
     * Tìm booking theo ID, ném lỗi nếu không tồn tại.
     * FIX: RuntimeException -> ResourceNotFoundException (404 thay vì 500)
     */
    private Booking findBookingOrThrow(Integer bookingId) {
        return bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking", "id", bookingId));
    }

    /** Sinh mã booking dạng BK-YYYYMMDD-XXXXXX. */
    private String generateBookingCode() {
        String date = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String suffix = UUID.randomUUID().toString().replace("-", "").substring(0, 6).toUpperCase();
        return "BK-" + date + "-" + suffix;
    }

    /**
     * Tính điểm ưu tiên dựa theo tier của customer.
     * Tier càng cao → điểm càng cao → xử lý trước trong hàng đợi.
     */
    private int resolvePriorityScore(Customer customer) {
        if (customer.getTierId() == null) return 1;
        return switch (customer.getTierId()) {
            case 4 -> 4;
            case 3 -> 3;
            case 2 -> 2;
            default -> 1;
        };
    }

    // Sửa lại đúng — dùng Vehicle.VehicleType không phải Promotion.VehicleType
    private Vehicle.VehicleType resolveVehicleType(String vehicleType) {
        if (vehicleType == null || vehicleType.isBlank()) {
            return Vehicle.VehicleType.car;
        }

        return switch (vehicleType.trim().toLowerCase()) {
            case "4_seats", "4", "4 chỗ", "4 cho" -> Vehicle.VehicleType.car;
            case "7_seats", "7", "7 chỗ", "7 cho" -> Vehicle.VehicleType.suv;
            case "16_seats", "16", "16 chỗ", "16 cho" -> Vehicle.VehicleType.suv;
            default -> Vehicle.VehicleType.car;
        };
    }
}