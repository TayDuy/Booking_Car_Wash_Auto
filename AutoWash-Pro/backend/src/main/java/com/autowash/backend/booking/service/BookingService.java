package com.autowash.backend.booking.service;

import com.autowash.backend.booking.dto.BookingCreateRequestDTO;
import com.autowash.backend.booking.dto.BookingCreateResponseDTO;
import com.autowash.backend.booking.dto.BookingRescheduleRequestDTO;
import com.autowash.backend.booking.dto.BookingResponseDTO;
import com.autowash.backend.booking.dto.BookingSummaryResponseDTO;
import com.autowash.backend.booking.dto.BookingUpdateRequestDTO;

import java.util.List;

/**
 * Nghiệp vụ booking dùng chung cho Customer và Admin.
 *
 * Nghiệp vụ vận hành của Employee gồm:
 * - confirm
 * - check-in
 * - start wash
 * - complete
 *
 * đã được chuyển sang EmployeeService.
 */
public interface BookingService {

    // =========================================================
    // CREATE
    // =========================================================

    /**
     * Tạo booking.
     *
     * userId có giá trị:
     * - Customer đang tự tạo booking.
     *
     * userId null:
     * - Chỉ dành cho luồng Admin tạo hộ khách hàng.
     * - Employee tạo booking hộ sẽ được thiết kế riêng sau.
     */
    BookingCreateResponseDTO createBooking(
            BookingCreateRequestDTO request,
            Integer userId
    );

    // =========================================================
    // READ
    // =========================================================

    /**
     * Lấy chi tiết booking.
     *
     * Nếu userId khác null, service phải kiểm tra booking
     * có thuộc Customer đang đăng nhập hay không.
     */
    BookingResponseDTO getBookingById(
            Integer bookingId,
            Integer userId
    );

    /**
     * Admin lấy toàn bộ booking.
     */
    List<BookingSummaryResponseDTO> getAllBookings();

    /**
     * Customer lấy danh sách booking của mình.
     */
    List<BookingSummaryResponseDTO> getBookingsByCustomer(
            Integer customerId,
            Integer userId,
            Integer limit
    );

    // =========================================================
    // UPDATE — ADMIN
    // =========================================================

    /**
     * Admin cập nhật thông tin booking.
     *
     * Không dùng phương thức này để chuyển trạng thái vận hành.
     */
    BookingResponseDTO updateBooking(
            Integer bookingId,
            BookingUpdateRequestDTO request
    );

    // =========================================================
    // CANCEL
    // =========================================================

    /**
     * Admin hủy một booking.
     *
     * userId hiện được giữ lại để tương thích với logic cũ.
     */
    BookingResponseDTO cancelBooking(
            Integer bookingId,
            Integer userId
    );

    /**
     * Customer hủy booking của chính mình.
     *
     * Service phải kiểm tra quyền sở hữu booking.
     */
    BookingResponseDTO cancelOwnBooking(
            Integer bookingId,
            Integer userId
    );

    // =========================================================
    // RESCHEDULE
    // =========================================================

    /**
     * Customer đổi lịch booking của chính mình.
     */
    BookingResponseDTO rescheduleBooking(
            Integer bookingId,
            Integer userId,
            BookingRescheduleRequestDTO request
    );
}