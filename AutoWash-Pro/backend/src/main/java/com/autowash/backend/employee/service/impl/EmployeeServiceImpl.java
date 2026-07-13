package com.autowash.backend.employee.service.impl;

import com.autowash.backend.booking.entity.Booking;
import com.autowash.backend.booking.entity.BookingDetail;
import com.autowash.backend.booking.enums.BookingStatus;
import com.autowash.backend.booking.repository.BookingDetailRepository;
import com.autowash.backend.booking.repository.BookingRepository;
import com.autowash.backend.branch.entity.Branch;
import com.autowash.backend.common.exception.BusinessException;
import com.autowash.backend.employee.dto.EmployeeProfileResponseDTO;
import com.autowash.backend.employee.dto.EmployeeQueueBookingResponseDTO;
import com.autowash.backend.employee.entity.Employee;
import com.autowash.backend.employee.entity.Employee.StaffStatus;
import com.autowash.backend.employee.mapper.EmployeeMapper;
import com.autowash.backend.employee.repository.EmployeeRepository;
import com.autowash.backend.employee.service.EmployeeService;
import com.autowash.backend.timeslot.entity.TimeSlot;
import com.autowash.backend.washbay.entity.WashBay;
import com.autowash.backend.washbay.entity.WashBay.BayStatus;
import com.autowash.backend.common.exception.ResourceNotFoundException;
import com.autowash.backend.customer.entity.Customer;
import com.autowash.backend.customer.repository.CustomerRepository;
import com.autowash.backend.employee.dto.EmployeeBookingCreateRequestDTO;
import com.autowash.backend.servicepackage.entity.ServicePackage;
import com.autowash.backend.servicepackage.repository.ServicePackageRepository;
import com.autowash.backend.timeslot.repository.TimeSlotRepository;
import com.autowash.backend.vehicle.entity.Vehicle;
import com.autowash.backend.vehicle.repository.VehicleRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Locale;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class EmployeeServiceImpl implements EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final BookingRepository bookingRepository;
    private final BookingDetailRepository bookingDetailRepository;
    private final EmployeeMapper employeeMapper;

    private final CustomerRepository customerRepository;
    private final VehicleRepository vehicleRepository;
    private final TimeSlotRepository timeSlotRepository;
    private final ServicePackageRepository servicePackageRepository;

    // =========================================================
    // PROFILE
    // =========================================================

    @Override
    public EmployeeProfileResponseDTO getMyProfile(Integer userId) {
        Employee employee = getCurrentActiveEmployee(userId);

        requireLinkedUser(employee);
        requireBranch(employee);

        return employeeMapper.toProfileResponse(employee);
    }

    // =========================================================
    // QUEUE
    // =========================================================

    @Override
    public List<EmployeeQueueBookingResponseDTO> getMyBranchQueue(
            Integer userId,
            LocalDate date,
            BookingStatus status
    ) {
        Employee employee = getCurrentActiveEmployee(userId);
        Branch branch = requireBranch(employee);

        LocalDate selectedDate = date != null
                ? date
                : LocalDate.now();

        List<BookingStatus> statuses = resolveQueueStatuses(status);

        List<Booking> bookings = bookingRepository.findEmployeeQueue(
                branch.getBranchId(),
                selectedDate,
                statuses
        );

        return mapQueueResponses(bookings);
    }

    // =========================================================
    // BOOKING DETAIL
    // =========================================================

    @Override
    public EmployeeQueueBookingResponseDTO getMyBranchBookingById(
            Integer userId,
            Integer bookingId
    ) {
        Employee employee = getCurrentActiveEmployee(userId);
        Branch branch = requireBranch(employee);

        Booking booking = getBranchBooking(
                bookingId,
                branch.getBranchId()
        );

        return mapBookingResponse(booking);
    }

    @Override
    public EmployeeQueueBookingResponseDTO findMyBranchBookingByCode(
            Integer userId,
            String bookingCode
    ) {
        Employee employee = getCurrentActiveEmployee(userId);
        Branch branch = requireBranch(employee);

        String normalizedCode = normalizeBookingCode(bookingCode);

        Booking booking = bookingRepository
                .findEmployeeBookingByCode(
                        normalizedCode,
                        branch.getBranchId()
                )
                .orElseThrow(() -> new BusinessException(
                        "Không tìm thấy booking trong chi nhánh của bạn",
                        HttpStatus.NOT_FOUND
                ));

        return mapBookingResponse(booking);
    }

    // =========================================================
    // CREATE BOOKING FOR CUSTOMER
    // =========================================================

    @Override
    @Transactional
    public EmployeeQueueBookingResponseDTO createBookingForCustomer(
            Integer userId,
            EmployeeBookingCreateRequestDTO request
    ) {
        if (request == null) {
            throw new BusinessException(
                    "Dữ liệu tạo booking không được để trống",
                    HttpStatus.BAD_REQUEST
            );
        }

        Employee employee = getCurrentActiveEmployee(userId);
        Branch branch = requireOperationalBranch(employee);

        /*
         * Customer có thể là:
         * - Khách đã có customerId.
         * - Khách vãng lai chưa có tài khoản.
         */
        Customer customer = resolveBookingCustomer(request);

        /*
         * Tái sử dụng xe cũ của Customer nếu trùng biển số.
         * Nếu chưa có thì tạo xe mới.
         */
        Vehicle vehicle = resolveBookingVehicle(customer, request);

        /*
         * Khóa slot bằng SELECT ... FOR UPDATE để tránh hai request
         * cùng đặt vào vị trí cuối cùng của slot.
         */
        TimeSlot slot = timeSlotRepository
                .findByIdForUpdate(request.getSlotId())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "TimeSlot",
                                "id",
                                request.getSlotId()
                        )
                );

        /*
         * Employee không được tạo booking sang chi nhánh khác.
         * Branch luôn lấy từ Employee đăng nhập, không lấy từ request.
         */
        if (slot.getBranch() == null
                || slot.getBranch().getBranchId() == null
                || !branch.getBranchId().equals(
                slot.getBranch().getBranchId()
        )) {
            throw new BusinessException(
                    "Khung giờ không thuộc chi nhánh của nhân viên",
                    HttpStatus.FORBIDDEN
            );
        }

        LocalDateTime slotStart = LocalDateTime.of(
                slot.getSlotDate(),
                slot.getStartTime()
        );

        if (slotStart.isBefore(LocalDateTime.now())) {
            throw new BusinessException(
                    "Không thể tạo booking cho khung giờ đã qua",
                    HttpStatus.BAD_REQUEST
            );
        }

        if (!slot.hasCapacity()) {
            throw new BusinessException(
                    "Khung giờ đã đầy hoặc không còn hoạt động",
                    HttpStatus.CONFLICT
            );
        }

        List<BookingDetail> details =
                buildBookingDetails(request.getDetails());

        slot.incrementBookings();
        timeSlotRepository.save(slot);

        Booking booking = Booking.builder()
                .customer(customer)
                .vehicle(vehicle)
                .slot(slot)
                .branch(branch)
                .bookingCode(generateUniqueBookingCode())
                .status(BookingStatus.pending)
                .priorityScore(resolvePriorityScore(customer))
                .note(trimToNull(request.getNote()))
                .startTime(slotStart)
                .endTime(LocalDateTime.of(
                        slot.getSlotDate(),
                        slot.getEndTime()
                ))
                .build();

        Booking savedBooking = bookingRepository.save(booking);

        details.forEach(detail ->
                detail.setBooking(savedBooking)
        );

        List<BookingDetail> savedDetails =
                bookingDetailRepository.saveAll(details);

        log.info(
                "[Employee] Employee #{} tạo booking #{} ({}) cho Customer #{} tại Branch #{}",
                employee.getEmployeeId(),
                savedBooking.getBookingId(),
                savedBooking.getBookingCode(),
                customer.getCustomerId(),
                branch.getBranchId()
        );

        return employeeMapper.toQueueResponse(
                savedBooking,
                savedDetails
        );
    }

    // =========================================================
    // CONFIRM BOOKING
    // pending → confirmed
    // =========================================================

    @Override
    @Transactional
    public EmployeeQueueBookingResponseDTO confirmBooking(
            Integer userId,
            Integer bookingId
    ) {
        Employee employee = getCurrentActiveEmployee(userId);
        Branch branch = requireOperationalBranch(employee);

        requireQueueManager(employee);

        Booking booking = getBranchBooking(
                bookingId,
                branch.getBranchId()
        );

        if (!booking.canConfirm()) {
            throw invalidTransition(
                    booking,
                    "xác nhận",
                    BookingStatus.pending
            );
        }

        booking.setStatus(BookingStatus.confirmed);

        Booking savedBooking = bookingRepository.save(booking);

        log.info(
                "[Employee] Employee #{} xác nhận booking #{} ({})",
                employee.getEmployeeId(),
                savedBooking.getBookingId(),
                savedBooking.getBookingCode()
        );

        return mapBookingResponse(savedBooking);
    }

    // =========================================================
    // CHECK-IN
    // confirmed → checked_in
    // =========================================================

    @Override
    @Transactional
    public EmployeeQueueBookingResponseDTO checkInBooking(
            Integer userId,
            Integer bookingId
    ) {
        Employee employee = getCurrentActiveEmployee(userId);
        Branch branch = requireOperationalBranch(employee);

        Booking booking = getBranchBooking(
                bookingId,
                branch.getBranchId()
        );

        if (!booking.canCheckIn()) {
            throw invalidTransition(
                    booking,
                    "check-in",
                    BookingStatus.confirmed
            );
        }

        booking.setStatus(BookingStatus.checked_in);
        booking.setCheckInAt(LocalDateTime.now());

        Booking savedBooking = bookingRepository.save(booking);

        log.info(
                "[Employee] Employee #{} check-in booking #{} ({})",
                employee.getEmployeeId(),
                savedBooking.getBookingId(),
                savedBooking.getBookingCode()
        );

        return mapBookingResponse(savedBooking);
    }

    // =========================================================
    // START WASH
    // checked_in → in_progress
    // =========================================================

    @Override
    @Transactional
    public EmployeeQueueBookingResponseDTO startWash(
            Integer userId,
            Integer bookingId
    ) {
        Employee employee = getCurrentActiveEmployee(userId);
        Branch branch = requireOperationalBranch(employee);

        Booking booking = getBranchBooking(
                bookingId,
                branch.getBranchId()
        );

        if (!booking.canStartWash()) {
            throw invalidTransition(
                    booking,
                    "bắt đầu rửa xe",
                    BookingStatus.checked_in
            );
        }

        WashBay washBay = requireWashBay(booking);

        requireWashBayBelongsToBranch(
                washBay,
                branch.getBranchId()
        );

        if (!BayStatus.available.equals(washBay.getStatus())) {
            throw new BusinessException(
                    "Khu vực rửa xe '" + washBay.getBayName()
                            + "' hiện không khả dụng. Trạng thái hiện tại: "
                            + washBay.getStatus(),
                    HttpStatus.CONFLICT
            );
        }

        /*
         * Không ghi đè nhân viên đã được phân công trước đó.
         * Trường hợp này thường là dữ liệu không đồng bộ.
         */
        if (booking.getAssignedStaff() != null
                && !booking.isAssignedTo(employee.getEmployeeId())) {
            throw new BusinessException(
                    "Booking đã được phân công cho nhân viên khác",
                    HttpStatus.CONFLICT
            );
        }

        booking.setAssignedStaff(employee);
        booking.setStatus(BookingStatus.in_progress);
        washBay.setStatus(BayStatus.occupied);

        Booking savedBooking = bookingRepository.save(booking);

        log.info(
                "[Employee] Employee #{} bắt đầu xử lý booking #{} tại wash bay #{}",
                employee.getEmployeeId(),
                savedBooking.getBookingId(),
                washBay.getBayId()
        );

        return mapBookingResponse(savedBooking);
    }

    // =========================================================
    // COMPLETE WASH
    // in_progress → completed
    // =========================================================

    @Override
    @Transactional
    public EmployeeQueueBookingResponseDTO completeWash(
            Integer userId,
            Integer bookingId
    ) {
        Employee employee = getCurrentActiveEmployee(userId);
        Branch branch = requireOperationalBranch(employee);

        Booking booking = getBranchBooking(
                bookingId,
                branch.getBranchId()
        );

        if (!booking.canComplete()) {
            throw invalidTransition(
                    booking,
                    "hoàn thành dịch vụ",
                    BookingStatus.in_progress
            );
        }

        requireCanCompleteBooking(employee, booking);

        WashBay washBay = requireWashBay(booking);

        requireWashBayBelongsToBranch(
                washBay,
                branch.getBranchId()
        );

        if (!BayStatus.occupied.equals(washBay.getStatus())) {
            throw new BusinessException(
                    "Không thể hoàn thành booking vì wash bay '"
                            + washBay.getBayName()
                            + "' không ở trạng thái occupied",
                    HttpStatus.CONFLICT
            );
        }

        booking.setStatus(BookingStatus.completed);
        booking.setCompleteAt(LocalDateTime.now());

        washBay.setStatus(BayStatus.available);

        /*
         * Không cộng điểm loyalty tại đây.
         * Điểm chỉ được cộng khi payment chuyển sang paid.
         */
        Booking savedBooking = bookingRepository.save(booking);

        log.info(
                "[Employee] Employee #{} hoàn thành booking #{}; wash bay #{} chuyển về available",
                employee.getEmployeeId(),
                savedBooking.getBookingId(),
                washBay.getBayId()
        );

        return mapBookingResponse(savedBooking);
    }

    // =========================================================
// CREATE BOOKING HELPERS
// =========================================================

    private Customer resolveBookingCustomer(
            EmployeeBookingCreateRequestDTO request
    ) {
        /*
         * Khách đã tồn tại trong hệ thống.
         */
        if (request.hasExistingCustomer()) {
            return customerRepository
                    .findById(request.getCustomerId())
                    .orElseThrow(() ->
                            new ResourceNotFoundException(
                                    "Customer",
                                    "id",
                                    request.getCustomerId()
                            )
                    );
        }

        /*
         * Khách vãng lai.
         */
        if (!request.hasGuestInformation()) {
            throw new BusinessException(
                    "Khách vãng lai phải có họ tên và số điện thoại",
                    HttpStatus.BAD_REQUEST
            );
        }

        String guestName = request.getGuestName().trim();
        String guestPhone = normalizePhone(
                request.getGuestPhone()
        );
        String guestEmail = normalizeEmail(
                request.getGuestEmail()
        );

        /*
         * Chỉ tái sử dụng hồ sơ guest khi cả tên và số điện thoại
         * đều trùng, tránh gán nhầm những người dùng chung số điện thoại.
         */
        return customerRepository
                .findFirstByUserIsNullAndPhoneAndFullNameIgnoreCaseOrderByCustomerIdDesc(
                        guestPhone,
                        guestName
                )
                .map(existingGuest -> {
                    existingGuest.setFullName(guestName);
                    existingGuest.setPhone(guestPhone);

                    if (guestEmail != null) {
                        existingGuest.setEmail(guestEmail);
                    }

                    return customerRepository.save(existingGuest);
                })
                .orElseGet(() ->
                        customerRepository.save(
                                Customer.builder()
                                        .user(null)
                                        .fullName(guestName)
                                        .phone(guestPhone)
                                        .email(guestEmail)
                                        .totalPoints(0)
                                        .totalVisits(0)
                                        .totalSpending(BigDecimal.ZERO)
                                        .build()
                        )
                );
    }

    private Vehicle resolveBookingVehicle(
            Customer customer,
            EmployeeBookingCreateRequestDTO request
    ) {
        String normalizedPlate =
                normalizeLicensePlate(request.getLicensePlate());

        Vehicle.VehicleType requestedType =
                resolveVehicleType(request.getVehicleType());

        return vehicleRepository
                .findByLicensePlateAndCustomer_CustomerId(
                        normalizedPlate,
                        customer.getCustomerId()
                )
                .map(existingVehicle -> {
                    existingVehicle.setIsActive(true);
                    existingVehicle.setVehicleType(requestedType);

                    String brand = trimToNull(request.getBrand());
                    String model = trimToNull(request.getModel());

                    if (brand != null) {
                        existingVehicle.setBrand(brand);
                    }

                    if (model != null) {
                        existingVehicle.setModel(model);
                    }

                    return vehicleRepository.save(existingVehicle);
                })
                .orElseGet(() ->
                        vehicleRepository.save(
                                Vehicle.builder()
                                        .customer(customer)
                                        .licensePlate(normalizedPlate)
                                        .brand(trimToNull(request.getBrand()))
                                        .model(trimToNull(request.getModel()))
                                        .vehicleType(requestedType)
                                        .isActive(true)
                                        .build()
                        )
                );
    }

    private List<BookingDetail> buildBookingDetails(
            List<EmployeeBookingCreateRequestDTO.ServiceItem> requestedDetails
    ) {
        if (requestedDetails == null || requestedDetails.isEmpty()) {
            throw new BusinessException(
                    "Booking phải có ít nhất một dịch vụ",
                    HttpStatus.BAD_REQUEST
            );
        }

        List<BookingDetail> details = new ArrayList<>();

        for (EmployeeBookingCreateRequestDTO.ServiceItem item
                : requestedDetails) {

            if (item == null
                    || item.getServiceId() == null
                    || item.getQuantity() == null
                    || item.getQuantity() <= 0) {
                throw new BusinessException(
                        "Thông tin dịch vụ không hợp lệ",
                        HttpStatus.BAD_REQUEST
                );
            }

            ServicePackage servicePackage =
                    servicePackageRepository
                            .findById(item.getServiceId())
                            .orElseThrow(() ->
                                    new ResourceNotFoundException(
                                            "ServicePackage",
                                            "id",
                                            item.getServiceId()
                                    )
                            );

            BigDecimal unitPrice = servicePackage.getBasePrice();

            if (unitPrice == null
                    || unitPrice.compareTo(BigDecimal.ZERO) < 0) {
                throw new BusinessException(
                        "Giá dịch vụ không hợp lệ: "
                                + servicePackage.getServiceName(),
                        HttpStatus.CONFLICT
                );
            }

            BigDecimal subTotal = unitPrice.multiply(
                    BigDecimal.valueOf(item.getQuantity())
            );

            details.add(
                    BookingDetail.builder()
                            .service(servicePackage)
                            .quantity(item.getQuantity())
                            .unitPrice(unitPrice)
                            .subTotal(subTotal)
                            .build()
            );
        }

        return details;
    }

    private Vehicle.VehicleType resolveVehicleType(
            String vehicleType
    ) {
        if (vehicleType == null || vehicleType.isBlank()) {
            throw new BusinessException(
                    "Loại xe không được để trống",
                    HttpStatus.BAD_REQUEST
            );
        }

        String normalizedType = vehicleType
                .trim()
                .toLowerCase(Locale.ROOT);

        return switch (normalizedType) {
            case "car",
                 "sedan",
                 "4_seats",
                 "4-seats",
                 "4 seats" -> Vehicle.VehicleType.car;

            case "suv",
                 "7_seats",
                 "7-seats",
                 "7 seats" -> Vehicle.VehicleType.suv;

            default -> throw new BusinessException(
                    "Loại xe không hợp lệ: " + vehicleType,
                    HttpStatus.BAD_REQUEST
            );
        };
    }

    private int resolvePriorityScore(Customer customer) {
        if (customer == null || customer.getTierId() == null) {
            return 1;
        }

        return switch (customer.getTierId()) {
            case 4 -> 4;
            case 3 -> 3;
            case 2 -> 2;
            default -> 1;
        };
    }

    private String generateUniqueBookingCode() {
        for (int attempt = 0; attempt < 10; attempt++) {
            String date = LocalDateTime.now()
                    .format(DateTimeFormatter.ofPattern("yyyyMMdd"));

            String suffix = UUID.randomUUID()
                    .toString()
                    .replace("-", "")
                    .substring(0, 6)
                    .toUpperCase(Locale.ROOT);

            String bookingCode =
                    "BK-" + date + "-" + suffix;

            if (!bookingRepository.existsByBookingCode(bookingCode)) {
                return bookingCode;
            }
        }

        throw new BusinessException(
                "Không thể tạo mã booking duy nhất",
                HttpStatus.INTERNAL_SERVER_ERROR
        );
    }

    private String normalizeLicensePlate(String licensePlate) {
        if (licensePlate == null || licensePlate.isBlank()) {
            throw new BusinessException(
                    "Biển số xe không được để trống",
                    HttpStatus.BAD_REQUEST
            );
        }

        return licensePlate
                .trim()
                .toUpperCase(Locale.ROOT);
    }

    private String normalizePhone(String phone) {
        if (phone == null || phone.isBlank()) {
            throw new BusinessException(
                    "Số điện thoại khách hàng không được để trống",
                    HttpStatus.BAD_REQUEST
            );
        }

        return phone
                .trim()
                .replaceAll("\\s+", "");
    }

    private String normalizeEmail(String email) {
        if (email == null || email.isBlank()) {
            return null;
        }

        return email
                .trim()
                .toLowerCase(Locale.ROOT);
    }

    private String trimToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        return value.trim();
    }

    // =========================================================
    // EMPLOYEE VALIDATION
    // =========================================================

    private Employee getCurrentActiveEmployee(Integer userId) {
        if (userId == null) {
            throw new BusinessException(
                    "Không xác định được tài khoản đang đăng nhập",
                    HttpStatus.UNAUTHORIZED
            );
        }

        return employeeRepository
                .findByUser_IdAndStatus(
                        userId,
                        StaffStatus.active
                )
                .orElseThrow(() -> new BusinessException(
                        "Không tìm thấy hồ sơ nhân viên đang hoạt động",
                        HttpStatus.FORBIDDEN
                ));
    }

    private void requireLinkedUser(Employee employee) {
        if (employee.getUser() == null) {
            throw new BusinessException(
                    "Hồ sơ nhân viên chưa được liên kết với tài khoản đăng nhập",
                    HttpStatus.CONFLICT
            );
        }
    }

    private Branch requireBranch(Employee employee) {
        if (employee.getBranch() == null) {
            throw new BusinessException(
                    "Nhân viên chưa được phân công chi nhánh",
                    HttpStatus.CONFLICT
            );
        }

        return employee.getBranch();
    }

    /**
     * Dùng cho thao tác làm thay đổi hoạt động tại chi nhánh.
     */
    private Branch requireOperationalBranch(Employee employee) {
        Branch branch = requireBranch(employee);

        if (!branch.isAcceptingBookings()) {
            throw new BusinessException(
                    "Chi nhánh của nhân viên hiện không hoạt động",
                    HttpStatus.CONFLICT
            );
        }

        return branch;
    }

    /**
     * Chỉ supervisor hoặc manager được xác nhận booking.
     */
    private void requireQueueManager(Employee employee) {
        if (!employee.canManageQueue()) {
            throw new BusinessException(
                    "Bạn không có quyền xác nhận booking",
                    HttpStatus.FORBIDDEN
            );
        }
    }

    /**
     * Nhân viên được phân công có thể hoàn thành booking.
     * Supervisor hoặc manager có thể hoàn thành thay.
     */
    private void requireCanCompleteBooking(
            Employee employee,
            Booking booking
    ) {
        boolean assignedToCurrentEmployee =
                booking.isAssignedTo(employee.getEmployeeId());

        if (!assignedToCurrentEmployee
                && !employee.canManageQueue()) {
            throw new BusinessException(
                    "Booking đang được phân công cho nhân viên khác",
                    HttpStatus.FORBIDDEN
            );
        }
    }

    // =========================================================
    // BOOKING VALIDATION
    // =========================================================

    private Booking getBranchBooking(
            Integer bookingId,
            Integer branchId
    ) {
        if (bookingId == null) {
            throw new BusinessException(
                    "Booking ID không được để trống",
                    HttpStatus.BAD_REQUEST
            );
        }

        return bookingRepository
                .findEmployeeBookingById(
                        bookingId,
                        branchId
                )
                .orElseThrow(() -> new BusinessException(
                        "Không tìm thấy booking trong chi nhánh của bạn",
                        HttpStatus.NOT_FOUND
                ));
    }

    private BusinessException invalidTransition(
            Booking booking,
            String action,
            BookingStatus expectedStatus
    ) {
        return new BusinessException(
                "Không thể " + action
                        + " booking đang ở trạng thái '"
                        + booking.getStatus()
                        + "'. Trạng thái yêu cầu: '"
                        + expectedStatus
                        + "'",
                HttpStatus.CONFLICT
        );
    }

    // =========================================================
    // WASH BAY VALIDATION
    // =========================================================

    private WashBay requireWashBay(Booking booking) {
        TimeSlot slot = booking.getSlot();

        if (slot == null) {
            throw new BusinessException(
                    "Booking chưa được gán khung giờ",
                    HttpStatus.CONFLICT
            );
        }

        if (slot.getWashBay() == null) {
            throw new BusinessException(
                    "Khung giờ của booking chưa được gán wash bay",
                    HttpStatus.CONFLICT
            );
        }

        return slot.getWashBay();
    }

    private void requireWashBayBelongsToBranch(
            WashBay washBay,
            Integer branchId
    ) {
        if (washBay.getBranch() == null
                || washBay.getBranch().getBranchId() == null
                || !washBay.getBranch().getBranchId().equals(branchId)) {
            throw new BusinessException(
                    "Wash bay không thuộc chi nhánh của nhân viên",
                    HttpStatus.CONFLICT
            );
        }
    }

    // =========================================================
    // NORMALIZATION
    // =========================================================

    private List<BookingStatus> resolveQueueStatuses(
            BookingStatus status
    ) {
        if (status != null) {
            return List.of(status);
        }

        return List.of(
                BookingStatus.pending,
                BookingStatus.confirmed,
                BookingStatus.checked_in,
                BookingStatus.in_progress
        );
    }

    private String normalizeBookingCode(String bookingCode) {
        if (bookingCode == null || bookingCode.isBlank()) {
            throw new BusinessException(
                    "Mã booking không được để trống",
                    HttpStatus.BAD_REQUEST
            );
        }

        return bookingCode.trim().toUpperCase();
    }

    // =========================================================
    // MAPPING
    // =========================================================

    private EmployeeQueueBookingResponseDTO mapBookingResponse(
            Booking booking
    ) {
        List<BookingDetail> details =
                bookingDetailRepository.findByBooking(booking);

        return employeeMapper.toQueueResponse(
                booking,
                details
        );
    }

    private List<EmployeeQueueBookingResponseDTO> mapQueueResponses(
            List<Booking> bookings
    ) {
        if (bookings == null || bookings.isEmpty()) {
            return Collections.emptyList();
        }

        List<Integer> bookingIds = bookings.stream()
                .map(Booking::getBookingId)
                .toList();

        List<BookingDetail> details =
                bookingDetailRepository.findByBooking_BookingIdIn(
                        bookingIds
                );

        Map<Integer, List<BookingDetail>> detailsByBooking =
                details.stream()
                        .collect(Collectors.groupingBy(
                                detail -> detail.getBooking().getBookingId()
                        ));

        return bookings.stream()
                .map(booking -> employeeMapper.toQueueResponse(
                        booking,
                        detailsByBooking.getOrDefault(
                                booking.getBookingId(),
                                Collections.emptyList()
                        )
                ))
                .toList();
    }
}