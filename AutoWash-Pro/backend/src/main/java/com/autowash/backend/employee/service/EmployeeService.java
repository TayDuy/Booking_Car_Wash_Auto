package com.autowash.backend.employee.service;

import com.autowash.backend.booking.enums.BookingStatus;
import com.autowash.backend.employee.dto.EmployeeBookingCreateRequestDTO;
import com.autowash.backend.employee.dto.EmployeeProfileResponseDTO;
import com.autowash.backend.employee.dto.EmployeeQueueBookingResponseDTO;

import java.time.LocalDate;
import java.util.List;

/**
 * Nghiệp vụ dành cho tài khoản Employee.
 *
 * Mọi thao tác booking đều phải:
 * - Xác định Employee từ userId đăng nhập.
 * - Giới hạn trong chi nhánh của Employee.
 * - Kiểm tra trạng thái Employee.
 */
public interface EmployeeService {

    // =========================================================
    // PROFILE
    // =========================================================

    /**
     * Lấy hồ sơ Employee đang đăng nhập.
     */
    EmployeeProfileResponseDTO getMyProfile(Integer userId);

    // =========================================================
    // QUEUE
    // =========================================================

    /**
     * Lấy hàng chờ booking thuộc chi nhánh của Employee.
     *
     * date null:
     * - Mặc định lấy ngày hiện tại tại implementation.
     *
     * status null:
     * - Lấy tất cả trạng thái nằm trong hàng chờ vận hành.
     */
    List<EmployeeQueueBookingResponseDTO> getMyBranchQueue(
            Integer userId,
            LocalDate date,
            BookingStatus status
    );

    /**
     * Xem chi tiết một booking thuộc chi nhánh Employee.
     */
    EmployeeQueueBookingResponseDTO getMyBranchBookingById(
            Integer userId,
            Integer bookingId
    );

    /**
     * Tìm booking theo bookingCode trong chi nhánh Employee.
     */
    EmployeeQueueBookingResponseDTO findMyBranchBookingByCode(
            Integer userId,
            String bookingCode
    );

    // =========================================================
    // CREATE BOOKING FOR CUSTOMER
    // =========================================================

    /**
     * Employee tạo booking hộ khách tại quầy.
     *
     * Hỗ trợ:
     * - Khách đã có customerId.
     * - Khách vãng lai chưa có tài khoản.
     *
     * Chi nhánh không lấy từ request.
     * Backend tự lấy từ Employee đang đăng nhập.
     *
     * Slot phải thuộc cùng chi nhánh với Employee.
     */
    EmployeeQueueBookingResponseDTO createBookingForCustomer(
            Integer userId,
            EmployeeBookingCreateRequestDTO request
    );

    // =========================================================
    // CONFIRM
    // pending -> confirmed
    // =========================================================

    /**
     * Xác nhận booking.
     *
     * Chỉ Employee có role supervisor hoặc manager.
     */
    EmployeeQueueBookingResponseDTO confirmBooking(
            Integer userId,
            Integer bookingId
    );

    // =========================================================
    // CHECK-IN
    // confirmed -> checked_in
    // =========================================================

    /**
     * Check-in xe khi khách đến chi nhánh.
     */
    EmployeeQueueBookingResponseDTO checkInBooking(
            Integer userId,
            Integer bookingId
    );

    // =========================================================
    // START WASH
    // checked_in -> in_progress
    // =========================================================

    /**
     * Bắt đầu rửa xe.
     *
     * Đồng thời:
     * - Gán Employee vào assignedStaff.
     * - Chuyển WashBay sang occupied.
     */
    EmployeeQueueBookingResponseDTO startWash(
            Integer userId,
            Integer bookingId
    );

    // =========================================================
    // COMPLETE
    // in_progress -> completed
    // =========================================================

    /**
     * Hoàn thành quá trình rửa xe.
     *
     * Đồng thời:
     * - Ghi completeAt.
     * - Trả WashBay về available.
     *
     * Không cộng điểm loyalty tại đây.
     */
    EmployeeQueueBookingResponseDTO completeWash(
            Integer userId,
            Integer bookingId
    );
}