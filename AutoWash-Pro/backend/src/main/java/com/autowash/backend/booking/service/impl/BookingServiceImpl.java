package com.autowash.backend.booking.service.impl;

import com.autowash.backend.booking.dto.*;
import com.autowash.backend.booking.entity.Booking;
import com.autowash.backend.booking.enums.BookingStatus;
import com.autowash.backend.booking.enums.BookingSortOption;
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
import com.autowash.backend.notification.dto.NotificationCreateDTO;
import com.autowash.backend.notification.entity.Notification;
import com.autowash.backend.notification.service.NotificationService;
import com.autowash.backend.promotion.entity.Promotion;
import com.autowash.backend.servicepackage.entity.ServicePackage;
import com.autowash.backend.servicepackage.repository.ServicePackageRepository;
import com.autowash.backend.timeslot.entity.TimeSlot;
import com.autowash.backend.timeslot.repository.TimeSlotRepository;
import com.autowash.backend.vehicle.entity.Vehicle;
import com.autowash.backend.vehicle.repository.VehicleRepository;
import com.autowash.backend.washbay.entity.WashBay;
import com.autowash.backend.customerreward.entity.CustomerReward;
import com.autowash.backend.customerreward.repository.CustomerRewardRepository;
import com.autowash.backend.payment.entity.Payment;
import com.autowash.backend.payment.repository.PaymentRepository;
import com.autowash.backend.promotion.repository.PromotionUseRepository;
import com.autowash.backend.loyaltytier.entity.LoyaltyTier;
import com.autowash.backend.loyaltytier.repository.LoyaltyTierRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collection;
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
    private final com.autowash.backend.mail.service.MailService mailService;
    private final NotificationService notificationService;
    private final CustomerRewardRepository customerRewardRepository;
    private final PaymentRepository paymentRepository;
    private final PromotionUseRepository promotionUseRepository;
    private final LoyaltyTierRepository loyaltyTierRepository;


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

        // Kiểm tra biển số trên toàn bộ DB trước (tránh unique constraint violation)
        String normalizedPlate = request.getLicensePlate().trim().toUpperCase();
        Vehicle vehicle = vehicleRepository.findByLicensePlate(normalizedPlate)
                .map(existing -> {
                    boolean needsUpdate = false;

                    // Xe đã tồn tại (của bất kỳ customer nào) -> gán lại cho customer hiện tại
                    if (!existing.getCustomer().getCustomerId().equals(customer.getCustomerId())) {
                        existing.setCustomer(customer);
                        needsUpdate = true;
                    }

                    // Kích hoạt lại nếu trước đó bị soft-delete
                    if (!Boolean.TRUE.equals(existing.getIsActive())) {
                        existing.setIsActive(true);
                        needsUpdate = true;
                    }

                    // Đồng bộ loại xe (4 chỗ / 7 chỗ)
                    Vehicle.VehicleType requestedType = resolveVehicleType(request.getVehicleType());
                    if (existing.getVehicleType() != requestedType) {
                        existing.setVehicleType(requestedType);
                        needsUpdate = true;
                    }

                    // Đồng bộ hãng xe (brand) nếu có thay đổi
                    if (request.getBrand() != null && !request.getBrand().trim().isEmpty()
                            && !request.getBrand().trim().equalsIgnoreCase(existing.getBrand())) {
                        existing.setBrand(request.getBrand().trim());
                        needsUpdate = true;
                    }

                    return needsUpdate ? vehicleRepository.save(existing) : existing;
                })
                .orElseGet(() -> {
                    // Biển số chưa tồn tại trong DB -> tạo xe mới
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

        // ── CHẶN ĐẶT LỊCH QUÁ KHỨ ──────────────────────────────────────
        // Ngăn khách đặt lịch cho ngày đã qua hoặc khung giờ đã trôi qua
        // trong ngày hôm nay. Frontend đã chặn ở UI nhưng backend phải là
        // lớp bảo vệ cuối cùng (defense-in-depth).
        LocalDateTime slotStart = LocalDateTime.of(slot.getSlotDate(), slot.getStartTime());
        if (slotStart.isBefore(LocalDateTime.now())) {
            throw new BusinessException(
                    "Không thể đặt lịch cho khung giờ đã qua. Vui lòng chọn thời gian trong tương lai.",
                    HttpStatus.BAD_REQUEST);
        }

        if (!slot.hasCapacity()) {
            throw new BusinessException("Slot đã đầy, vui lòng chọn khung giờ khác", HttpStatus.CONFLICT);
        }

        // ── CHECK BR-24..27: GIỚI HẠN SỐ NGÀY ĐẶT TRƯỚC THEO TIER KHÁCH HÀNG ──────
        LoyaltyTier customerTier = customer.getTier();
        if (customerTier == null && customer.getTierId() != null) {
            customerTier = loyaltyTierRepository.findById(customer.getTierId()).orElse(null);
        }
        int maxWindowDays = (customerTier != null && customerTier.getBookingWindowDays() != null)
                ? customerTier.getBookingWindowDays()
                : 7; // Fallback 7 ngày nếu DB chưa set
        long daysInAdvance = java.time.temporal.ChronoUnit.DAYS.between(java.time.LocalDate.now(), slot.getSlotDate());
        if (daysInAdvance > maxWindowDays) {
            String tierName = customerTier != null ? customerTier.getTierName() : "Thành viên";
            throw new BusinessException(
                    "Hạng " + tierName + " chỉ được phép đặt lịch trước tối đa " + maxWindowDays + " ngày.",
                    HttpStatus.BAD_REQUEST);
        }

        // ── CHECK BR-11: KHÔNG CHO TẠO 2 BOOKING TRÙNG KHUNG GIỜ CÙNG KHÁCH ──────
        List<BookingStatus> activeStatuses = List.of(
                BookingStatus.pending,
                BookingStatus.confirmed,
                BookingStatus.checked_in,
                BookingStatus.in_progress
        );
        boolean hasOverlappingBooking = bookingRepository.existsOverlappingBookingForCustomer(
                customer.getCustomerId(),
                slot.getSlotDate(),
                slot.getStartTime(),
                slot.getEndTime(),
                activeStatuses
        );
        if (hasOverlappingBooking) {
            throw new BusinessException(
                    "Bạn đã có một lịch đặt xe khác trùng khung giờ này (" + slot.getStartTime() + " - " + slot.getEndTime() + ").",
                    HttpStatus.CONFLICT);
        }

        if (slot.getWashBay().getStatus() == WashBay.BayStatus.maintenance) {
            throw new BusinessException("Bay đang bảo trì, vui lòng chọn khung giờ khác.", HttpStatus.BAD_REQUEST);
        }

        Branch branch = branchRepository.findById(request.getBranchId())
                .orElseThrow(() -> new ResourceNotFoundException("Branch", "id", request.getBranchId()));

        if (!branch.isAcceptingBookings()) {
            throw new BusinessException("Chi nhánh hiện không hoạt động. Vui lòng chọn chi nhánh khác.", HttpStatus.CONFLICT);
        }

        List<BookingDetail> details = new ArrayList<>();
        for (BookingCreateRequestDTO.BookingDetailItem item : request.getDetails()) {
            ServicePackage servicePackage = servicePackageRepository.findById(item.getServiceId())
                    .orElseThrow(() -> new ResourceNotFoundException("ServicePackage", "id", item.getServiceId()));

            BigDecimal unitPrice = servicePackage.getBasePrice();
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

        // Gửi email xác nhận đặt lịch — chỉ gửi khi thanh toán offline (tại trạm)
        // Online payment → email sẽ được gửi sau khi thanh toán thành công ở PaymentServiceImpl
        boolean isOffline = request.getPaymentMethod() == null
                || "offline".equalsIgnoreCase(request.getPaymentMethod());
        if (isOffline) {
            sendConfirmationEmail(customer, savedBooking, branch, slot, details);
        }

        // Tạo thông báo in-app khi đặt lịch thành công
        try {
            if (customer.getUser() != null) {
                String serviceNames = details.stream()
                        .map(d -> d.getService().getServiceName())
                        .collect(Collectors.joining(", "));

                notificationService.create(NotificationCreateDTO.builder()
                        .userId(customer.getUser().getId())
                        .type(Notification.NotificationType.BOOKING_CONFIRMED)
                        .title("Đặt lịch thành công")
                        .body(String.format(
                                "Lịch rửa xe #%s (%s) tại %s vào %s %s đã được xác nhận.",
                                savedBooking.getBookingCode(),
                                serviceNames,
                                branch.getBranchName(),
                                slot.getSlotDate(),
                                slot.getStartTime()
                        ))
                        .referenceId(savedBooking.getBookingId())
                        .referenceType("booking")
                        .channel(Notification.NotificationChannel.in_app)
                        .build());
            }
        } catch (Exception e) {
            log.error("Lỗi khi tạo thông báo in-app cho booking {}: {}",
                    savedBooking.getBookingId(), e.getMessage(), e);
        }
        return bookingMapper.toCreateResponse(savedBooking, details, request.getPaymentMethod());
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

    @Override
    @Transactional(readOnly = true)
    public List<AssignableStaffResponseDTO> getAssignableStaff(
            Integer bookingId
    ) {
        Booking booking = findBookingOrThrow(bookingId);

        if (booking.getBranch() == null) {
            throw new BusinessException(
                    "Booking chưa có thông tin chi nhánh",
                    HttpStatus.CONFLICT
            );
        }

        Integer branchId = booking.getBranch().getBranchId();

        List<Employee> employees =
                employeeRepository.findByBranch_BranchIdAndStatus(
                        branchId,
                        Employee.StaffStatus.active
                );

        return employees.stream()
                .filter(Employee::isAssignable)
                .map(employee ->
                        AssignableStaffResponseDTO.builder()
                                .employeeId(employee.getEmployeeId())
                                .fullName(employee.getFullName())
                                .phone(employee.getPhone())
                                .email(employee.getEmail())
                                .role(employee.getRole())
                                .branchId(
                                        employee.getBranch() != null
                                                ? employee.getBranch().getBranchId()
                                                : null
                                )
                                .branchName(
                                        employee.getBranch() != null
                                                ? employee.getBranch().getBranchName()
                                                : null
                                )
                                .build()
                )
                .toList();
    }

    /** Lấy danh sách tóm tắt tất cả booking (phân trang). */
    @Override
    @Transactional(readOnly = true)
    public Page<BookingSummaryResponseDTO> getAllBookings(BookingSortOption sortOption, Pageable pageable) {
        BookingSortOption effectiveSort = sortOption != null ? sortOption : BookingSortOption.NEWEST;
        Page<Booking> bookingPage = effectiveSort == BookingSortOption.PRIORITY
                ? bookingRepository.findAllWithAssociationsOrderByPriority(pageable)
                : bookingRepository.findAllWithAssociationsOrderByNewest(pageable);
        List<BookingSummaryResponseDTO> dtos = mapToSummaryResponses(bookingPage.getContent());
        return new PageImpl<>(dtos, pageable, bookingPage.getTotalElements());
    }

    /** Lấy danh sách đơn hàng (checked_in, in_progress, completed) phân trang. */
    @Override
    @Transactional(readOnly = true)
    public Page<BookingSummaryResponseDTO> getAllOrders(Collection<BookingStatus> statuses, Pageable pageable) {
        Page<Booking> bookingPage = bookingRepository.findAllWithAssociationsByStatusIn(statuses, pageable);
        List<BookingSummaryResponseDTO> dtos = mapToSummaryResponses(bookingPage.getContent());
        return new PageImpl<>(dtos, pageable, bookingPage.getTotalElements());
    }

    /** Thống kê đơn hàng (checked_in, in_progress, completed). */
    @Override
    @Transactional(readOnly = true)
    public OrderStatisticsDTO getOrderStatistics(Collection<BookingStatus> statuses) {
        long total = bookingRepository.countByStatusIn(statuses);
        long checkedIn = bookingRepository.countByStatusIn(List.of(BookingStatus.checked_in));
        long inProgress = bookingRepository.countByStatusIn(List.of(BookingStatus.in_progress));
        long completed = bookingRepository.countByStatusIn(List.of(BookingStatus.completed));

        List<BigDecimal> totals = bookingRepository.findTotalAmountByStatusIn(statuses);
        BigDecimal totalValue = totals.stream()
                .filter(java.util.Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new OrderStatisticsDTO(total, checkedIn, inProgress, completed, totalValue);
    }

    /** Lấy danh sách booking theo customer, sắp xếp mới nhất trước. */
    @Override
    @Transactional(readOnly = true)
    public List<BookingSummaryResponseDTO> getBookingsByCustomer(Integer customerId, Integer userId, Integer limit) {
        if (userId != null) {
            Customer customer = customerRepository.findByUser_Id(userId)
                    .orElseThrow(() -> new BusinessException("Không tìm thấy khách hàng", HttpStatus.FORBIDDEN));
            if (!customer.getCustomerId().equals(customerId)) {
                throw new BusinessException("Bạn không có quyền truy cập danh sách đặt lịch này", HttpStatus.FORBIDDEN);
            }
        }
        List<Booking> bookings = bookingRepository.findByCustomerWithAssociations(customerId);
        if (limit != null && limit > 0 && bookings.size() > limit) {
            bookings = bookings.subList(0, limit);
        }
        return mapToSummaryResponses(bookings);
    }

    private List<BookingSummaryResponseDTO> mapToSummaryResponses(List<Booking> bookings) {
        if (bookings.isEmpty()) {
            return Collections.emptyList();
        }
        List<Integer> bookingIds = bookings.stream().map(Booking::getBookingId).toList();

        List<BookingDetail> details = bookingDetailRepository.findByBooking_BookingIdIn(bookingIds);
        Map<Integer, List<BookingDetail>> detailsMap = details.stream()
                .collect(Collectors.groupingBy(d -> d.getBooking().getBookingId()));

        // Batch-fetch payment thay vì để booking.getPayment() lazy-load từng
        // booking một (N+1 query) — nguyên nhân chính khiến trang danh sách
        // booking load chậm khi số lượng booking lớn.
        List<Payment> payments = paymentRepository.findByBooking_BookingIdIn(bookingIds);
        Map<Integer, Payment> paymentMap = payments.stream()
                .collect(Collectors.toMap(p -> p.getBooking().getBookingId(), p -> p, (a, b) -> a));

        return bookings.stream()
                .map(b -> bookingMapper.toSummaryResponse(
                        b,
                        detailsMap.getOrDefault(b.getBookingId(), Collections.emptyList()),
                        paymentMap.get(b.getBookingId())
                ))
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

    @Override
    @Transactional
    public BookingResponseDTO confirmBooking(Integer bookingId) {
        Booking booking = findBookingOrThrow(bookingId);

        if (!BookingStatus.pending.equals(booking.getStatus())) {
            throw new BusinessException("Chỉ booking pending mới được xác nhận", HttpStatus.BAD_REQUEST);
        }

        booking.setStatus(BookingStatus.confirmed);

        Booking saved = bookingRepository.save(booking);
        List<BookingDetail> details = bookingDetailRepository.findByBooking(saved);
        return bookingMapper.toResponse(saved, details);
    }

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

        booking.setStatus(BookingStatus.checked_in);
        booking.setCheckInAt(LocalDateTime.now());

        Booking saved = bookingRepository.save(booking);
        List<BookingDetail> details = bookingDetailRepository.findByBooking(saved);
        return bookingMapper.toResponse(saved, details);
    }

    @Override
    @Transactional
    public BookingResponseDTO startWashBooking(Integer bookingId) {
        Booking booking = findBookingOrThrow(bookingId);

        if (!BookingStatus.checked_in.equals(booking.getStatus())) {
            throw new BusinessException(
                    "Chỉ booking checked_in mới được bắt đầu rửa",
                    HttpStatus.BAD_REQUEST
            );
        }

        Employee assignedStaff = booking.getAssignedStaff();

        if (assignedStaff == null) {
            throw new BusinessException(
                    "Booking chưa được phân công nhân viên",
                    HttpStatus.CONFLICT
            );
        }

        if (!assignedStaff.isAssignable()) {
            throw new BusinessException(
                    "Nhân viên được phân công hiện không hoạt động",
                    HttpStatus.CONFLICT
            );
        }

        if (
                assignedStaff.getBranch() == null ||
                        booking.getBranch() == null ||
                        !assignedStaff.getBranch().getBranchId()
                                .equals(booking.getBranch().getBranchId())
        ) {
            throw new BusinessException(
                    "Nhân viên được phân công không thuộc chi nhánh của booking",
                    HttpStatus.CONFLICT
            );
        }

        TimeSlot slot = booking.getSlot();

        if (slot == null || slot.getWashBay() == null) {
            throw new BusinessException(
                    "Booking chưa được gán khu vực rửa xe",
                    HttpStatus.CONFLICT
            );
        }

        WashBay washBay = slot.getWashBay();

        if (
                washBay.getBranch() == null ||
                        booking.getBranch() == null ||
                        !washBay.getBranch().getBranchId()
                                .equals(booking.getBranch().getBranchId())
        ) {
            throw new BusinessException(
                    "Khu vực rửa xe không thuộc chi nhánh của booking",
                    HttpStatus.CONFLICT
            );
        }

        if (!WashBay.BayStatus.available.equals(washBay.getStatus())) {
            throw new BusinessException(
                    "Khu vực rửa xe '" +
                            washBay.getBayName() +
                            "' hiện không khả dụng. Trạng thái: " +
                            washBay.getStatus(),
                    HttpStatus.CONFLICT
            );
        }

        booking.setStatus(BookingStatus.in_progress);
        washBay.setStatus(WashBay.BayStatus.occupied);

        Booking saved = bookingRepository.save(booking);

        log.info(
                "[Admin] Bắt đầu xử lý booking #{}; nhân viên #{}; wash bay #{}",
                saved.getBookingId(),
                assignedStaff.getEmployeeId(),
                washBay.getBayId()
        );

        List<BookingDetail> details =
                bookingDetailRepository.findByBooking(saved);

        return bookingMapper.toResponse(saved, details);
    }

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

        TimeSlot newSlot = timeSlotRepository.findByIdForUpdate(request.getNewSlotId())
                .orElseThrow(() -> new ResourceNotFoundException("TimeSlot", "id", request.getNewSlotId()));

        if (!newSlot.hasCapacity()) {
            throw new BusinessException("Khung giờ mới đã đầy, vui lòng chọn khung giờ khác", HttpStatus.CONFLICT);
        }

        TimeSlot oldSlot = booking.getSlot();
        oldSlot.decrementBookings();
        timeSlotRepository.save(oldSlot);

        newSlot.incrementBookings();
        timeSlotRepository.save(newSlot);

        booking.setSlot(newSlot);
        if (request.getNote() != null) {
            booking.setNote(request.getNote());
        }

        Booking saved = bookingRepository.save(booking);
        List<BookingDetail> details = bookingDetailRepository.findByBooking(saved);
        return bookingMapper.toResponse(saved, details);
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

        // Hoàn trả voucher đổi thưởng nếu có về trạng thái UNUSED
        customerRewardRepository.findByUsedBookingId(booking.getBookingId()).ifPresent(voucher -> {
            voucher.setStatus("UNUSED");
            voucher.setUsedBookingId(null);
            voucher.setUsedAt(null);
            customerRewardRepository.saveAndFlush(voucher);
            log.info("[Booking] Hoàn trả voucher {} về trạng thái UNUSED do hủy lịch #{}", voucher.getVoucherCode(), booking.getBookingId());
        });

        // Hủy payment record unpaid nếu có và giải phóng promotion dùng kèm
        paymentRepository.findByBooking_BookingId(booking.getBookingId()).ifPresent(payment -> {
            if (payment.getPaymentStatus() == Payment.PaymentStatus.unpaid) {
                payment.setPaymentStatus(Payment.PaymentStatus.cancelled);
                paymentRepository.saveAndFlush(payment);
                log.info("[Booking] Hủy payment unpaid #{} do hủy lịch #{}", payment.getPaymentId(), booking.getBookingId());

                if (payment.getPromotion() != null) {
                    try {
                        promotionUseRepository.deleteByPromotionIdAndCustomerId(
                                payment.getPromotion().getPromotionId(),
                                booking.getCustomer().getCustomerId()
                        );
                        promotionUseRepository.flush();
                        log.info("[Booking] Giải phóng promotion #{} cho khách hàng #{} do hủy lịch #{}",
                                payment.getPromotion().getPromotionId(), booking.getCustomer().getCustomerId(), booking.getBookingId());
                    } catch (Exception e) {
                        log.error("Lỗi khi giải phóng Promotion khi hủy lịch: ", e);
                    }
                }
            }
        });

        // Giảm số lượng đặt trên slot để mở lại capacity
        // decrementBookings() trong entity tự chuyển status → open nếu còn chỗ
        TimeSlot slot = booking.getSlot();
        slot.decrementBookings();
        timeSlotRepository.save(slot);

        Booking saved = bookingRepository.save(booking);

        notifyBookingCancelled(saved);

        return bookingMapper.toResponse(saved, bookingDetailRepository.findByBooking(saved));
    }

    /** Gửi email + tạo thông báo in-app khi một booking bị hủy. */
    private void notifyBookingCancelled(Booking booking) {
        Customer customer = booking.getCustomer();

        try {
            if (customer.getUser() != null) {
                notificationService.create(NotificationCreateDTO.builder()
                        .userId(customer.getUser().getId())
                        .type(Notification.NotificationType.BOOKING_CANCELLED)
                        .title("Đặt lịch đã bị hủy")
                        .body(String.format("Lịch rửa xe #%s đã bị hủy.", booking.getBookingCode()))
                        .referenceId(booking.getBookingId())
                        .referenceType("booking")
                        .channel(Notification.NotificationChannel.in_app)
                        .build());
            }
        } catch (Exception e) {
            log.error("Lỗi khi tạo thông báo in-app cho việc hủy booking {}: {}",
                    booking.getBookingId(), e.getMessage(), e);
        }

        try {
            String toEmail = customer.getUser() != null ? customer.getUser().getEmail() : null;
            if (toEmail != null) {
                mailService.sendBookingCancelledEmail(
                        toEmail,
                        customer.getFullName(),
                        booking.getBookingCode(),
                        booking.getNote()
                );
            }
        } catch (Exception e) {
            log.error("Lỗi khi kích hoạt gửi email hủy booking {}: {}",
                    booking.getBookingId(), e.getMessage(), e);
        }
    }

    /**
     * Hoàn thành booking — chuyển sang "completed".
     * Chỉ được gọi khi booking đang ở trạng thái pending hoặc in_progress.
     * Sau bước này client mới được tạo Payment cho booking.
     */
    @Override
    @Transactional
    public BookingResponseDTO completeBooking(Integer bookingId) {
        Booking booking = findBookingOrThrow(bookingId);

        if (!BookingStatus.in_progress.equals(booking.getStatus())) {
            throw new BusinessException("Chỉ có thể hoàn thành booking đang xử lý (in_progress)",
                    HttpStatus.BAD_REQUEST);
        }

        TimeSlot slot = booking.getSlot();

        if (slot == null || slot.getWashBay() == null) {
            throw new BusinessException(
                    "Booking không có khu vực rửa xe",
                    HttpStatus.CONFLICT
            );
        }

        WashBay washBay = slot.getWashBay();

        if (!WashBay.BayStatus.occupied.equals(washBay.getStatus())) {
            throw new BusinessException(
                    "Không thể hoàn thành booking vì khu vực rửa xe '" +
                            washBay.getBayName() +
                            "' không ở trạng thái occupied",
                    HttpStatus.CONFLICT
            );
        }

        booking.setStatus(BookingStatus.completed);
        booking.setCompleteAt(LocalDateTime.now());
        washBay.setStatus(WashBay.BayStatus.available);

        paymentRepository.findByBooking_BookingId(booking.getBookingId()).ifPresent(payment -> {
            if (payment.getPaymentStatus() == Payment.PaymentStatus.unpaid) {
                Payment.PaymentMethod method = payment.getPaymentMethod();
                if (method == Payment.PaymentMethod.cash || method == Payment.PaymentMethod.pos) {
                    payment.setPaymentStatus(Payment.PaymentStatus.paid);
                    payment.setPaidAt(LocalDateTime.now());
                    paymentRepository.saveAndFlush(payment);
                    log.info("[Booking] Cập nhật payment #{} → PAID (phương thức offline {}) do hoàn thành lịch đặt #{}",
                            payment.getPaymentId(), method, booking.getBookingId());
                } else {
                    log.info("[Booking] Payment #{} giữ nguyên unpaid (phương thức online {}), chờ cổng thanh toán xác nhận.",
                            payment.getPaymentId(), method);
                }
            }
        });

        slot.decrementBookings();
        timeSlotRepository.save(slot);

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
        return switch (vehicleType) {
            case "4_seats" -> Vehicle.VehicleType.FOUR_SEATS;
            case "7_seats" -> Vehicle.VehicleType.SEVEN_SEATS;
            default -> Vehicle.VehicleType.FOUR_SEATS;
        };
    }

    private void sendConfirmationEmail(Customer customer, Booking booking, Branch branch,
                                       TimeSlot slot, List<BookingDetail> details) {
        try {
            String toEmail = customer.getUser() != null ? customer.getUser().getEmail() : null;
            if (toEmail == null) return;

            String serviceNames = details.stream()
                    .map(d -> d.getService().getServiceName())
                    .collect(Collectors.joining(", "));
            BigDecimal totalPrice = details.stream()
                    .map(BookingDetail::getSubTotal)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            mailService.sendBookingConfirmationEmail(
                    toEmail,
                    customer.getFullName(),
                    booking.getBookingCode(),
                    branch.getBranchName(),
                    branch.getAddress(),
                    serviceNames,
                    slot.getSlotDate(),
                    slot.getStartTime(),
                    slot.getEndTime(),
                    totalPrice
            );
        } catch (Exception e) {
            log.error("Lỗi khi gửi email xác nhận đặt lịch: {}", e.getMessage(), e);
        }
    }
}