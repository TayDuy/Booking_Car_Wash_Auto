package com.autowash.backend.booking.mapper;

import com.autowash.backend.booking.dto.*;
import com.autowash.backend.booking.entity.Booking;
import com.autowash.backend.booking.entity.BookingDetail;
import com.autowash.backend.booking.enums.BookingStatus;
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
    public BookingCreateResponseDTO toCreateResponse(Booking booking, List<BookingDetail> details) {
        BigDecimal totalAmount = sumTotal(details);

        return BookingCreateResponseDTO.builder()
                .bookingId(booking.getBookingId())
                .bookingCode(booking.getBookingCode())
                .bookingDate(booking.getBookingDate())
                .status(booking.getStatus())
                .totalAmount(totalAmount)
                .message("Booking đã được tạo thành công, đang chờ xác nhận.")
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

        return BookingResponseDTO.builder()
                // Thông tin booking
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
                // Customer
                .customerId(booking.getCustomer().getCustomerId())
                .customerName(booking.getCustomer().getFullName())
                .customerPhone(
                        booking.getCustomer().resolvePhone()
                )
                // Vehicle
                .vehicleId(booking.getVehicle().getVehicleId())
                .licensePlate(booking.getVehicle().getLicensePlate())
                .vehicleType(booking.getVehicle().getVehicleType())
                // TimeSlot — tách thành date + startTime + endTime
                .slotId(booking.getSlot().getSlotId())
                .slotDate(booking.getSlot().getSlotDate())
                .slotStartTime(booking.getSlot().getStartTime())
                .slotEndTime(booking.getSlot().getEndTime())
                // Branch
                .branchId(booking.getBranch().getBranchId())
                .branchName(booking.getBranch().getBranchName())
                // Staff — null nếu chưa phân công
                .assignedStaffId(booking.getAssignedStaff() != null
                        ? booking.getAssignedStaff().getEmployeeId() : null)
                .assignedStaffName(booking.getAssignedStaff() != null
                        ? booking.getAssignedStaff().getFullName() : null)
                .details(detailItems)
                .build();
    }

    /**
     * Response tóm tắt cho danh sách booking — bỏ detailItems để giảm payload.
     */
    public BookingSummaryResponseDTO toSummaryResponse(Booking booking, List<BookingDetail> details) {
        return BookingSummaryResponseDTO.builder()
                .bookingId(booking.getBookingId())
                .bookingCode(booking.getBookingCode())
                .bookingDate(booking.getBookingDate())
                .status(booking.getStatus())
                .checkInAt(booking.getCheckInAt())
                .completedAt(booking.getCompleteAt())
                .loyaltyPointGranted(booking.getLoyaltyPointGranted())
                .priorityScore(booking.getPriorityScore())
                .customerName(booking.getCustomer().getFullName())
                .licensePlate(booking.getVehicle().getLicensePlate())
                .branchName(booking.getBranch().getBranchName())
                .slotDate(booking.getSlot().getSlotDate())
                .slotStartTime(booking.getSlot().getStartTime())
                .totalAmount(sumTotal(details))
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