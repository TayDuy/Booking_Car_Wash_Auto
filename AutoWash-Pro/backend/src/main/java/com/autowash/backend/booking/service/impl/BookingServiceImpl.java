package com.autowash.backend.booking.service.impl;

import com.autowash.backend.booking.dto.*;
import com.autowash.backend.booking.entity.Booking;
import com.autowash.backend.booking.entity.Booking.BookingStatus;
import com.autowash.backend.booking.entity.BookingDetail;
import com.autowash.backend.booking.repository.BookingDetailRepository;
import com.autowash.backend.booking.repository.BookingRepository;
import com.autowash.backend.booking.service.BookingService;
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

    @Override
    @Transactional
    public BookingCreateResponseDTO createBooking(
            BookingCreateRequestDTO request) {

        Customer customer = customerRepository.findById(
                        request.getCustomerId())
                .orElseThrow(() ->
                        new RuntimeException("Customer không tồn tại"));

        Vehicle vehicle = vehicleRepository.findById(
                        request.getVehicleId())
                .orElseThrow(() ->
                        new RuntimeException("Vehicle không tồn tại"));

        TimeSlot slot = timeSlotRepository.findById(
                        request.getSlotId())
                .orElseThrow(() ->
                        new RuntimeException("Slot không tồn tại"));

        if (!slot.hasCapacity()) {
            throw new RuntimeException(
                    "Slot đã đầy, vui lòng chọn khung giờ khác");
        }

        // FIX: Bổ sung logic lấy Branch để map vào entity Booking (tránh lỗi null)
        Branch branch = branchRepository.findById(
                        request.getBranchId())
                .orElseThrow(() ->
                        new RuntimeException("Branch không tồn tại"));

        List<BookingDetail> details = new ArrayList<>();

        for (BookingCreateRequestDTO.BookingDetailItem item
                : request.getDetails()) {

            ServicePackage servicePackage =
                    servicePackageRepository.findById(
                                    item.getServiceId())
                            .orElseThrow(() ->
                                    new RuntimeException(
                                            "Dịch vụ không tồn tại"));

            BigDecimal unitPrice =
                    servicePackage.getBasePrice();

            BigDecimal subTotal =
                    unitPrice.multiply(
                            BigDecimal.valueOf(
                                    item.getQuantity()));

            BookingDetail detail = BookingDetail.builder()
                    .service(servicePackage)
                    .quantity(item.getQuantity())
                    .unitPrice(unitPrice)
                    .subTotal(subTotal)
                    .build();

            details.add(detail);
        }

        try {
            slot.incrementBookings();
            // FIX: Dùng saveAndFlush để JPA lập tức chạy câu lệnh UPDATE xuống DB.
            // Có như vậy mới bắt được ObjectOptimisticLockingFailureException tại đây.
            timeSlotRepository.saveAndFlush(slot);
        } catch (ObjectOptimisticLockingFailureException e) {
            throw new RuntimeException(
                    "Slot vừa được người khác đặt");
        }

        Booking booking = Booking.builder()
                .customer(customer)
                .vehicle(vehicle)
                .slot(slot)
                // FIX: Thêm branch vào entity (chỗ này trước đó bị bỏ quên gây lỗi thiếu FK)
                .branch(branch)
                .bookingCode(generateBookingCode())
                .status(BookingStatus.pending)
                .priorityScore(resolvePriorityScore(customer))
                .note(request.getNote())
                // FIX: Tự động khởi tạo thời gian startTime và endTime từ TimeSlot
                .startTime(LocalDateTime.of(slot.getSlotDate(), slot.getStartTime()))
                .endTime(LocalDateTime.of(slot.getSlotDate(), slot.getEndTime()))
                .build();

        Booking savedBooking =
                bookingRepository.save(booking);

        details.forEach(
                detail -> detail.setBooking(savedBooking));

        bookingDetailRepository.saveAll(details);

        return BookingCreateResponseDTO.fromEntity(
                savedBooking,
                details
        );
    }

    @Override
    @Transactional(readOnly = true)
    public BookingResponseDTO getBookingById(
            Integer bookingId) {

        Booking booking = findBookingOrThrow(bookingId);

        return BookingResponseDTO.fromEntity(
                booking
        );
    }

    @Override
    @Transactional(readOnly = true)
    public List<BookingSummaryResponseDTO> getAllBookings() {

        return bookingRepository.findAll()
                .stream()
                .map(BookingSummaryResponseDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<BookingSummaryResponseDTO>
    getBookingsByCustomer(Integer customerId) {

        return bookingRepository
                .findByCustomer_CustomerIdOrderByBookingDateDesc(
                        customerId)
                .stream()
                .map(BookingSummaryResponseDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public BookingResponseDTO updateBooking(
            Integer bookingId,
            BookingUpdateRequestDTO request) {

        Booking booking = findBookingOrThrow(bookingId);

        if (request.getNote() != null) {
            booking.setNote(request.getNote());
        }

        if (request.getAssignedStaffId() != null) {

            Employee employee =
                    employeeRepository.findById(
                                    request.getAssignedStaffId())
                            .orElseThrow(() ->
                                    new RuntimeException(
                                            "Không tìm thấy nhân viên"));

            booking.setAssignedStaff(employee);
        }

        return BookingResponseDTO.fromEntity(
                bookingRepository.save(booking)
        );
    }

    @Override
    @Transactional
    public BookingResponseDTO cancelBooking(
            Integer bookingId) {

        Booking booking = findBookingOrThrow(bookingId);

        booking.setStatus(BookingStatus.cancelled);

        TimeSlot slot = booking.getSlot();
        slot.decrementBookings();

        timeSlotRepository.save(slot);

        return BookingResponseDTO.fromEntity(
                bookingRepository.save(booking)
        );
    }

    private Booking findBookingOrThrow(Integer bookingId) {

        return bookingRepository.findById(bookingId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Booking không tồn tại"));
    }

    private String generateBookingCode() {

        String date =
                LocalDateTime.now().format(
                        DateTimeFormatter.ofPattern(
                                "yyyyMMdd"));

        String suffix =
                UUID.randomUUID()
                        .toString()
                        .replace("-", "")
                        .substring(0, 6)
                        .toUpperCase();

        return "BK-" + date + "-" + suffix;
    }

    private int resolvePriorityScore(
            Customer customer) {

        if (customer.getTierId() == null) {
            return 1;
        }

        return switch (customer.getTierId()) {
            case 4 -> 4;
            case 3 -> 3;
            case 2 -> 2;
            default -> 1;
        };
    }
}