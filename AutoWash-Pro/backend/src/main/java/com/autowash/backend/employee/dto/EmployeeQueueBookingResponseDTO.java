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
 * Dữ liệu booking dành cho Employee.
 *
 * Dùng cho:
 * - Danh sách hàng đợi.
 * - Chi tiết booking.
 * - Dashboard.
 * - Kết quả thao tác booking.
 *
 * Không trả password, password hash hoặc token của Customer.
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
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private LocalDateTime checkInAt;
    private LocalDateTime completedAt;

    /**
     * Số phút từ lúc khách check-in.
     */
    @Builder.Default
    private Long waitingMinutes = 0L;

    /**
     * True khi booking đã quá thời gian đến cho phép
     * nhưng khách chưa check-in.
     */
    @Builder.Default
    private Boolean overdue = false;

    private String note;

    // =========================================================
    // CUSTOMER ACCOUNT
    // =========================================================

    /**
     * ID trong bảng customer.
     */
    private Integer customerId;

    /**
     * ID trong bảng account.
     */
    private Integer customerUserId;

    /**
     * Username để Customer đăng nhập website.
     */
    private String customerUsername;

    private String customerName;

    /**
     * Ví dụ:
     * 0912345678 → 091****678
     */
    private String customerPhoneMasked;

    private Integer customerTierId;
    private String customerTierName;

    /**
     * Tổng điểm tích lũy của Customer.
     */
    @Builder.Default
    private Integer customerPoints = 0;

    /**
     * True khi quá trình tạo booking vừa tạo User và Customer mới.
     */
    @Builder.Default
    private Boolean accountCreated = false;

    // =========================================================
    // VEHICLE
    // =========================================================

    private Integer vehicleId;
    private String licensePlate;
    private String vehicleBrand;
    private String vehicleModel;

    /**
     * car hoặc suv.
     */
    private String vehicleType;

    /**
     * Xe 4 chỗ hoặc Xe 7 chỗ.
     */
    private String vehicleTypeLabel;

    // =========================================================
    // SERVICES
    // =========================================================

    /**
     * Giữ lại để tương thích frontend queue hiện tại.
     */
    private List<String> serviceNames;

    /**
     * Danh sách chi tiết để trang booking detail hiển thị
     * quantity, unitPrice và subTotal.
     */
    private List<ServiceItemResponse> services;

    /**
     * Tổng từ BookingDetail.subTotal.
     */
    @Builder.Default
    private BigDecimal totalAmount = BigDecimal.ZERO;

    // =========================================================
    // PAYMENT
    // =========================================================

    private Integer paymentId;
    private String paymentMethod;
    private String paymentStatus;

    @Builder.Default
    private BigDecimal discountAmount = BigDecimal.ZERO;

    @Builder.Default
    private BigDecimal finalAmount = BigDecimal.ZERO;

    private LocalDateTime paidAt;

    @Builder.Default
    private Boolean paid = false;

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
    // ALLOWED ACTIONS
    // =========================================================

    /**
     * Frontend dùng các field này để ẩn hoặc hiện nút.
     *
     * Đây chỉ là hỗ trợ giao diện.
     * Backend vẫn phải kiểm tra lại status và quyền.
     */
    @Builder.Default
    private Boolean canConfirm = false;

    @Builder.Default
    private Boolean canCheckIn = false;

    @Builder.Default
    private Boolean canStartWash = false;

    @Builder.Default
    private Boolean canComplete = false;

    @Builder.Default
    private Boolean canCancel = false;

    @Builder.Default
    private Boolean canMarkNoShow = false;

    // =========================================================
    // SERVICE ITEM
    // =========================================================

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ServiceItemResponse {

        private Integer serviceId;
        private String serviceName;

        @Builder.Default
        private Integer quantity = 0;

        /**
         * Giá được lưu trong BookingDetail tại thời điểm đặt.
         */
        @Builder.Default
        private BigDecimal unitPrice = BigDecimal.ZERO;

        @Builder.Default
        private BigDecimal subTotal = BigDecimal.ZERO;
    }
}