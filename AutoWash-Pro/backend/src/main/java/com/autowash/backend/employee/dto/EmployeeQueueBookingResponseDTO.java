package com.autowash.backend.employee.dto;

import com.autowash.backend.booking.enums.BookingStatus;
import com.autowash.backend.washbay.entity.WashBay.BayStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

/**
 * Dữ liệu một booking trong hàng chờ của trang Employee.
 *
 * Không trả toàn bộ thông tin nhạy cảm của khách hàng.
 * Số điện thoại trong danh sách phải được che bớt.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmployeeQueueBookingResponseDTO {

    // =========================================================
    // BOOKING
    // =========================================================

    private Integer bookingId;
    private String bookingCode;
    private BookingStatus status;
    private Integer priorityScore;
    private LocalDateTime bookingDate;

    private LocalDateTime checkInAt;
    private LocalDateTime completedAt;

    /**
     * Số phút khách đã chờ tính từ checkInAt.
     * Nếu chưa check-in thì trả về 0.
     */
    private Long waitingMinutes;

    private String note;

    // =========================================================
    // CUSTOMER
    // =========================================================

    private Integer customerId;
    private String customerName;

    /**
     * Ví dụ:
     * 0912345678 → 091****678
     */
    private String customerPhoneMasked;

    // =========================================================
    // VEHICLE
    // =========================================================

    private Integer vehicleId;
    private String licensePlate;
    private String vehicleType;

    // =========================================================
    // SERVICE
    // =========================================================

    private List<String> serviceNames;
    private BigDecimal totalAmount;

    // =========================================================
    // SLOT
    // =========================================================

    private Integer slotId;
    private LocalDate slotDate;
    private LocalTime slotStartTime;
    private LocalTime slotEndTime;

    // =========================================================
    // BRANCH
    // =========================================================

    private Integer branchId;
    private String branchName;

    // =========================================================
    // WASH BAY
    // =========================================================

    private Integer bayId;
    private String bayName;
    private BayStatus bayStatus;

    // =========================================================
    // ASSIGNED EMPLOYEE
    // =========================================================

    private Integer assignedEmployeeId;
    private String assignedEmployeeName;

    // =========================================================
    // PAYMENT
    // =========================================================

    /**
     * Null nếu booking chưa có payment nào được tạo
     * (chưa thu tiền mặt tại quầy, chưa tạo yêu cầu thanh toán online).
     */
    private Integer paymentId;

    /**
     * unpaid / paid / failed / cancelled.
     * Null nếu chưa có payment.
     */
    private String paymentStatus;

    /**
     * cash / bank_transfer / pos / paypal.
     * Null nếu chưa có payment.
     */
    private String paymentMethod;
}