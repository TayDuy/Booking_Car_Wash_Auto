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
import com.autowash.backend.promotion.entity.Promotion;
import com.autowash.backend.servicepackage.entity.ServicePackage;
import com.autowash.backend.servicepackage.repository.ServicePackageRepository;
import com.autowash.backend.timeslot.entity.TimeSlot;
import com.autowash.backend.timeslot.repository.TimeSlotRepository;
import com.autowash.backend.vehicle.entity.Vehicle;
import com.autowash.backend.vehicle.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
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
    public BookingCreateResponseDTO createBooking(BookingCreateRequestDTO request) {

        Customer customer = customerRepository.findById(request.getCustomerId())
                .orElseThrow(() -> new ResourceNotFoundException("Customer", "id", request.getCustomerId()));

        // ← Thay vehicleRepository.findById bằng logic check biển số
        Vehicle vehicle = vehicleRepository.findByLicensePlate(request.getLicensePlate())
                .orElseGet(() -> {
                    // Sửa trong BookingServiceImpl.java chỗ tạo xe mới:
                    Vehicle newVehicle = Vehicle.builder()
                            .customer(customer)
                            .licensePlate(request.getLicensePlate())
                            .brand(request.getBrand())
                            .model(request.getModel())   // ← THÊM dòng này
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

        return bookingMapper.toCreateResponse(savedBooking, details);
    }
    // ── READ ─────────────────────────────────────────────────────────────────

    /** Lấy chi tiết một booking theo ID. */
    @Override
    @Transactional(readOnly = true)
    public BookingResponseDTO getBookingById(Integer bookingId) {
        Booking booking = findBookingOrThrow(bookingId);
        List<BookingDetail> details = bookingDetailRepository.findByBooking(booking);
        return bookingMapper.toResponse(booking, details);
    }

    /** Lấy danh sách tóm tắt tất cả booking. */
    @Override
    @Transactional(readOnly = true)
    public List<BookingSummaryResponseDTO> getAllBookings() {
        return bookingRepository.findAll().stream()
                .map(b -> bookingMapper.toSummaryResponse(b, bookingDetailRepository.findByBooking(b)))
                .collect(Collectors.toList());
    }

    /** Lấy danh sách booking theo customer, sắp xếp mới nhất trước. */
    @Override
    @Transactional(readOnly = true)
    public List<BookingSummaryResponseDTO> getBookingsByCustomer(Integer customerId) {
        return bookingRepository.findByCustomer_CustomerIdOrderByBookingDateDesc(customerId).stream()
                .map(b -> bookingMapper.toSummaryResponse(b, bookingDetailRepository.findByBooking(b)))
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
     */
    @Override
    @Transactional
    public BookingResponseDTO cancelBooking(Integer bookingId) {
        Booking booking = findBookingOrThrow(bookingId);
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
     * Hoàn thành booking — chuyển sang "completed".
     * Chỉ được gọi khi booking đang ở trạng thái pending hoặc in_progress.
     * Sau bước này client mới được tạo Payment cho booking.
     */
    @Override
    @Transactional
    public BookingResponseDTO completeBooking(Integer bookingId) {
        Booking booking = findBookingOrThrow(bookingId);

        // FIX: RuntimeException -> BusinessException(BAD_REQUEST, ...)
        // → Đây là lỗi sai luồng nghiệp vụ (sai trạng thái), trả 400
        //   kèm message rõ ràng, thay vì 500 generic.
        if (!BookingStatus.in_progress.equals(booking.getStatus())
                && !BookingStatus.pending.equals(booking.getStatus())) {
            // FIX: BusinessException nhận (message, httpStatus) - đúng thứ tự tham số
            throw new BusinessException("Chỉ có thể hoàn thành booking đang xử lý hoặc đang chờ",
                    HttpStatus.BAD_REQUEST);
        }

        booking.setStatus(BookingStatus.completed);

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
            case "4_seats" -> Vehicle.VehicleType.car;
            case "7_seats" -> Vehicle.VehicleType.suv;
            default -> Vehicle.VehicleType.car;
        };
    }
}