package com.autowash.backend.booking.mapper;

import com.autowash.backend.booking.dto.*;
import com.autowash.backend.booking.entity.Booking;
import com.autowash.backend.booking.entity.BookingDetail;
import com.autowash.backend.booking.enums.BookingStatus;
import com.autowash.backend.payment.entity.Payment;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

/**
 * Mapper chuyển đổi Booking/BookingDetail entity ↔ DTO.
 * Mọi logic flatten quan hệ lazy tập trung tại đây — DTO không import entity.
 */
@Component
public class BookingMapper {

    /**
     * Response gọn sau khi tạo booking — chỉ trả thông tin xác nhận cơ bản.
     * totalAmount tính từ details vì Booking entity không lưu trực tiếp.
     */
    public BookingCreateResponseDTO toCreateResponse(Booking booking, List<BookingDetail> details, String paymentMethod) {
        BigDecimal totalAmount = sumTotal(details);

        List<BookingDetailItemResponseDTO> detailItems = details.stream()
                .map(this::toDetailItemResponse)
                .toList();

        return BookingCreateResponseDTO.builder()
                .bookingId(booking.getBookingId())
                .bookingCode(booking.getBookingCode())
                .bookingDate(booking.getBookingDate())
                .status(booking.getStatus())
                .totalAmount(totalAmount)
                .message("Booking đã được tạo thành công, đang chờ xác nhận.")
                .details(detailItems)
                .slotDate(booking.getSlot() != null ? booking.getSlot().getSlotDate() : null)
                .slotStartTime(booking.getSlot() != null ? booking.getSlot().getStartTime() : null)
                .slotEndTime(booking.getSlot() != null ? booking.getSlot().getEndTime() : null)
                .branchName(booking.getBranch() != null ? booking.getBranch().getBranchName() : null)
                .licensePlate(booking.getVehicle() != null ? booking.getVehicle().getLicensePlate() : null)
                .vehicleType(booking.getVehicle() != null ? booking.getVehicle().getVehicleType() : null)
                .vehicleNickname(booking.getVehicle() != null ? booking.getVehicle().getNickname() : null)
                .paymentMethod(paymentMethod)
                .build();
    }

    /**
     * Response đầy đủ — flatten toàn bộ quan hệ lazy.
     * Gọi trong @Transactional hoặc sau JOIN FETCH để tránh N+1.
     *
     * Lưu ý flatten:
     * - customerPhone → ưu tiên Customer.phone, fallback sang User.phone
     *  - slotDate/startTime/endTime → TimeSlot không có field slotTime, tách thành 3 field
     *  - assignedStaff → null-safe (chưa phân công khi mới tạo)
     */
    public BookingResponseDTO toResponse(Booking booking, List<BookingDetail> details) {
        List<BookingDetailItemResponseDTO> detailItems = details.stream()
                .map(this::toDetailItemResponse)
                .toList();

        Payment payment = booking.getPayment();
        String pStatus = payment != null ? payment.getPaymentStatus().name() : "unpaid";
        String pMethod = payment != null ? payment.getPaymentMethod().name() : "cash";

        var customer = booking.getCustomer();
        var vehicle = booking.getVehicle();
        var slot = booking.getSlot();
        var branch = booking.getBranch();

        return BookingResponseDTO.builder()
                .bookingId(booking.getBookingId())
                .bookingCode(booking.getBookingCode())
                .bookingDate(booking.getBookingDate())
                .status(booking.getStatus())
                .priorityScore(booking.getPriorityScore())
                .startTime(booking.getStartTime())
                .endTime(booking.getEndTime())
                .note(booking.getNote())
                .checkInAt(booking.getCheckInAt())
                .completedAt(booking.getCompleteAt())
                .loyaltyPointGranted(booking.getLoyaltyPointGranted())
                .updatedAt(booking.getUpdatedAt())
                .totalAmount(sumTotal(details))
                .customerId(customer != null ? customer.getCustomerId() : null)
                .customerName(customer != null ? customer.getFullName() : null)
                .customerPhone(customer != null
                        ? (customer.getPhone() != null ? customer.getPhone()
                           : customer.getUser() != null ? customer.getUser().getPhone() : null)
                        : null)
                .vehicleId(vehicle != null ? vehicle.getVehicleId() : null)
                .licensePlate(vehicle != null ? vehicle.getLicensePlate() : null)
                .vehicleType(vehicle != null ? vehicle.getVehicleType() : null)
                .vehicleNickname(vehicle != null ? vehicle.getNickname() : null)
                .slotId(slot != null ? slot.getSlotId() : null)
                .slotDate(slot != null ? slot.getSlotDate() : null)
                .slotStartTime(slot != null ? slot.getStartTime() : null)
                .slotEndTime(slot != null ? slot.getEndTime() : null)
                .branchId(branch != null ? branch.getBranchId() : null)
                .branchName(branch != null ? branch.getBranchName() : null)
                .assignedStaffId(booking.getAssignedStaff() != null
                        ? booking.getAssignedStaff().getEmployeeId() : null)
                .assignedStaffName(booking.getAssignedStaff() != null
                        ? booking.getAssignedStaff().getFullName() : null)
                .details(detailItems)
                .paymentStatus(pStatus)
                .paymentMethod(pMethod)
                .paymentId(payment != null ? payment.getPaymentId() : null)
                .originalAmount(payment != null ? payment.getOriginalAmount() : null)
                .discountAmount(payment != null ? payment.getDiscountAmount() : null)
                .finalAmount(payment != null && payment.getFinalAmount() != null ? payment.getFinalAmount() : sumTotal(details))
                .vnpayBankCode(payment != null ? payment.getVnpayBankCode() : null)
                .build();
    }

    public BookingSummaryResponseDTO toSummaryResponse(Booking booking, List<BookingDetail> details, Payment payment) {
        String pStatus = payment != null ? payment.getPaymentStatus().name() : "unpaid";
        String pMethod = payment != null ? payment.getPaymentMethod().name() : "cash";

        var customer = booking.getCustomer();
        var vehicle = booking.getVehicle();
        var slot = booking.getSlot();
        var branch = booking.getBranch();

        return BookingSummaryResponseDTO.builder()
                .bookingId(booking.getBookingId())
                .bookingCode(booking.getBookingCode())
                .bookingDate(booking.getBookingDate())
                .status(booking.getStatus())
                .checkInAt(booking.getCheckInAt())
                .completedAt(booking.getCompleteAt())
                .loyaltyPointGranted(booking.getLoyaltyPointGranted())
                .priorityScore(booking.getPriorityScore())
                .customerName(customer != null ? customer.getFullName() : null)
                .licensePlate(vehicle != null ? vehicle.getLicensePlate() : null)
                .vehicleNickname(vehicle != null ? vehicle.getNickname() : null)
                .branchName(branch != null ? branch.getBranchName() : null)
                .slotDate(slot != null ? slot.getSlotDate() : null)
                .slotStartTime(slot != null ? slot.getStartTime() : null)
                .totalAmount(sumTotal(details))
                .paymentStatus(pStatus)
                .paymentMethod(pMethod)
                .finalAmount(payment != null && payment.getFinalAmount() != null ? payment.getFinalAmount() : sumTotal(details))
                .build();
    }

    /**
     * Map một BookingDetail → DTO item.
     * unitPrice là snapshot giá lúc đặt, không đổi dù service thay giá sau.
     */
    public BookingDetailItemResponseDTO toDetailItemResponse(BookingDetail detail) {
        return BookingDetailItemResponseDTO.builder()
                .bookingDetailId(detail.getBookingDetailId())
                .serviceId(detail.getService().getServiceId())
                .serviceName(detail.getService().getServiceName())
                .description(detail.getService().getDescription())
                .durationMinutes(detail.getService().getDurationMinutes())
                .quantity(detail.getQuantity())
                .unitPrice(detail.getUnitPrice())
                .subTotal(detail.getSubTotal())
                .build();
    }

    /** Tính tổng tiền = sum(subTotal) của tất cả BookingDetail. */
    private BigDecimal sumTotal(List<BookingDetail> details) {
        return details.stream()
                .map(BookingDetail::getSubTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}