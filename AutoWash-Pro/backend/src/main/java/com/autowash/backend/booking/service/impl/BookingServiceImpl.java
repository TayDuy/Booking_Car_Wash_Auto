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
import com.autowash.backend.customer.entity.Customer;
import com.autowash.backend.customer.repository.CustomerRepository;
import com.autowash.backend.employee.entity.Employee;
import com.autowash.backend.employee.repository.EmployeeRepository;
import com.autowash.backend.servicepackage.entity.ServicePackage;
import com.autowash.backend.servicepackage.repository.ServicePackageRepository;
import com.autowash.backend.timeslot.entity.TimeSlot;
import com.autowash.backend.timeslot.repository.TimeSlotRepository;
import com.autowash.backend.vehicle.entity.Vehicle;
import com.autowash.backend.vehicle.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
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
     */
    @Override
    @Transactional
    public BookingCreateResponseDTO createBooking(BookingCreateRequestDTO request) {

        // Validate các entity liên quan
        Customer customer = customerRepository.findById(request.getCustomerId())
                .orElseThrow(() -> new RuntimeException("Customer không tồn tại"));

        Vehicle vehicle = vehicleRepository.findById(request.getVehicleId())
                .orElseThrow(() -> new RuntimeException("Vehicle không tồn tại"));

        TimeSlot slot = timeSlotRepository.findById(request.getSlotId())
                .orElseThrow(() -> new RuntimeException("Slot không tồn tại"));

        if (!slot.hasCapacity()) {
            throw new RuntimeException("Slot đã đầy, vui lòng chọn khung giờ khác");
        }

        Branch branch = branchRepository.findById(request.getBranchId())
                .orElseThrow(() -> new RuntimeException("Branch không tồn tại"));

        // Build danh sách BookingDetail từ request
        List<BookingDetail> details = new ArrayList<>();
        for (BookingCreateRequestDTO.BookingDetailItem item : request.getDetails()) {
            ServicePackage servicePackage = servicePackageRepository.findById(item.getServiceId())
                    .orElseThrow(() -> new RuntimeException("Dịch vụ không tồn tại"));

            BigDecimal unitPrice = servicePackage.getBasePrice();
            BigDecimal subTotal = unitPrice.multiply(BigDecimal.valueOf(item.getQuantity()));

            details.add(BookingDetail.builder()
                    .service(servicePackage)
                    .quantity(item.getQuantity())
                    .unitPrice(unitPrice)
                    .subTotal(subTotal)
                    .build());
        }

        // Tăng số lượng booking trên slot, flush ngay để bắt optimistic lock kịp thời
        try {
            slot.incrementBookings();
            timeSlotRepository.saveAndFlush(slot);
        } catch (ObjectOptimisticLockingFailureException e) {
            throw new RuntimeException("Slot vừa được người khác đặt");
        }

        // Tạo và lưu Booking
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

        // Gán booking vào từng detail rồi lưu
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
            Employee employee = employeeRepository.findById(request.getAssignedStaffId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy nhân viên"));
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

        if (!BookingStatus.in_progress.equals(booking.getStatus())
                && !BookingStatus.pending.equals(booking.getStatus())) {
            throw new RuntimeException("Chỉ có thể hoàn thành booking đang xử lý hoặc đang chờ");
        }

        booking.setStatus(BookingStatus.completed);

        Booking saved = bookingRepository.save(booking);
        return bookingMapper.toResponse(saved, bookingDetailRepository.findByBooking(saved));
    }

    // ── HELPERS ──────────────────────────────────────────────────────────────

    /** Tìm booking theo ID, ném lỗi nếu không tồn tại. */
    private Booking findBookingOrThrow(Integer bookingId) {
        return bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking không tồn tại"));
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
}