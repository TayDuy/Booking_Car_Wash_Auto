package com.autowash.backend.booking.dto;

import com.autowash.backend.booking.entity.Booking;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingSummaryResponseDTO {

    private Integer bookingId;
    private String bookingCode;
    private LocalDateTime bookingDate;
    private Booking.BookingStatus status;
    private Integer priorityScore;

    private String customerName;
    private String vehiclePlateNumber;
    private String branchName;

    public static BookingSummaryResponseDTO fromEntity(Booking booking) {
        return BookingSummaryResponseDTO.builder()
                .bookingId(booking.getBookingId())
                .bookingCode(booking.getBookingCode())
                .bookingDate(booking.getBookingDate())
                .status(booking.getStatus())
                .priorityScore(booking.getPriorityScore())
                .customerName(booking.getCustomer() != null ? booking.getCustomer().getFullName() : null)
                .vehiclePlateNumber(booking.getVehicle() != null ? booking.getVehicle().getLicensePlate() : null)
                .branchName(booking.getBranch() != null ? booking.getBranch().getBranchName() : null)
                .build();
    }
}