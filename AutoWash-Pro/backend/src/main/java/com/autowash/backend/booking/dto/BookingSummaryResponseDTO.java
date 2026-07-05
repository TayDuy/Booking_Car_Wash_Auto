package com.autowash.backend.booking.dto;

import com.autowash.backend.booking.enums.BookingStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

/**
 * DTO tóm tắt booking — dùng cho danh sách, không bao gồm chi tiết dịch vụ.
 * Không có fromEntity — mapping xử lý tại BookingMapper.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingSummaryResponseDTO {

    private Integer bookingId;
    private String bookingCode;
    private LocalDateTime bookingDate;
    private BookingStatus status;
    private LocalDateTime checkInAt;
    private LocalDateTime completedAt;
    private Boolean loyaltyPointGranted;

    private Integer priorityScore;

    private String customerName;
    private String licensePlate;            // đổi từ vehiclePlateNumber cho đồng nhất với Mapper
    private String branchName;

    // TimeSlot — tách date + startTime thay vì slotTime
    private LocalDate slotDate;
    private LocalTime slotStartTime;

    private BigDecimal totalAmount;         // sum(subTotal) từ BookingDetail
}