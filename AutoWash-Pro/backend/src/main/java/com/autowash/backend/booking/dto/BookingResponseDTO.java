package com.autowash.backend.booking.dto;

import com.autowash.backend.booking.enums.BookingStatus;
import com.autowash.backend.vehicle.entity.Vehicle;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

/**
 * DTO đầy đủ thông tin booking — dùng cho màn hình chi tiết.
 * Không có fromEntity — mapping xử lý tại BookingMapper.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingResponseDTO {

    // ── Thông tin booking ────────────────────────────────────────────────────
    private Integer bookingId;
    private String bookingCode;
    private LocalDateTime bookingDate;
    private BookingStatus status;
    private Integer priorityScore;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String note;
    private LocalDateTime updatedAt;
    private BigDecimal totalAmount;         // sum(subTotal) từ BookingDetail

    // ── Customer ─────────────────────────────────────────────────────────────
    private Integer customerId;
    private String customerName;
    private String customerPhone;           // lấy từ Customer.user.phone

    // ── Vehicle ──────────────────────────────────────────────────────────────
    private Integer vehicleId;
    private String licensePlate;
    private Vehicle.VehicleType vehicleType;

    // ── TimeSlot ─────────────────────────────────────────────────────────────
    // Không có field slotTime trong entity → tách thành 3 field riêng
    private Integer slotId;
    private LocalDate slotDate;
    private LocalTime slotStartTime;
    private LocalTime slotEndTime;

    // ── Branch ───────────────────────────────────────────────────────────────
    private Integer branchId;
    private String branchName;

    // ── Staff (null nếu chưa phân công) ─────────────────────────────────────
    private Integer assignedStaffId;
    private String assignedStaffName;

    // ── Chi tiết dịch vụ ─────────────────────────────────────────────────────
    private List<BookingDetailItemResponseDTO> details;
}