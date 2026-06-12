package com.autowash.backend.booking.dto;

import com.autowash.backend.booking.entity.Booking;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingResponseDTO {

    private Integer bookingId;
    private String bookingCode;
    private LocalDateTime bookingDate;
    private Booking.BookingStatus status;
    private Integer priorityScore;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String note;
    private LocalDateTime updatedAt;

    private Integer customerId;
    private String customerName;
    private String customerPhone;

    private Integer vehicleId;
    private String vehiclePlateNumber;

    private Integer branchId;
    private String branchName;

    private Integer slotId;

    private Integer assignedStaffId;
    private String assignedStaffName;

    public static BookingResponseDTO fromEntity(Booking booking) {
        return BookingResponseDTO.builder()
                .bookingId(booking.getBookingId())
                .bookingCode(booking.getBookingCode())
                .bookingDate(booking.getBookingDate())
                .status(booking.getStatus())
                .priorityScore(booking.getPriorityScore())
                .startTime(booking.getStartTime())
                .endTime(booking.getEndTime())
                .note(booking.getNote())
                .updatedAt(booking.getUpdatedAt())
                .customerId(booking.getCustomer() != null ? booking.getCustomer().getCustomerId() : null)
                .customerName(booking.getCustomer() != null ? booking.getCustomer().getFullName() : null)
                .customerPhone(booking.getCustomer() != null && booking.getCustomer().getUser() != null
                ? booking.getCustomer().getUser().getPhone() : null)
                .vehicleId(booking.getVehicle() != null ? booking.getVehicle().getVehicleId() : null)
                .vehiclePlateNumber(booking.getVehicle() != null ? booking.getVehicle().getLicensePlate() : null)
                .branchId(booking.getBranch() != null ? booking.getBranch().getBranchId() : null)
                .branchName(booking.getBranch() != null ? booking.getBranch().getBranchName() : null)
                .slotId(booking.getSlot() != null ? booking.getSlot().getSlotId() : null)
                .assignedStaffId(booking.getAssignedStaff() != null ? booking.getAssignedStaff().getEmployeeId() : null)
                .assignedStaffName(booking.getAssignedStaff() != null ? booking.getAssignedStaff().getFullName() : null)
                .build();
    }
}