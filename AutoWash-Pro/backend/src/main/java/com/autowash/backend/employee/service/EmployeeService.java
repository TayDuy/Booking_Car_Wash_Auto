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
    // NO-SHOW
    // confirmed -> no_show
    // =========================================================

    /**
     * Đánh dấu khách không đến đúng giờ.
     *
     * Điều kiện:
     * - Booking đang ở trạng thái confirmed.
     * - Đã quá thời gian chờ cho phép kể từ giờ bắt đầu của slot.
     * - Booking thuộc chi nhánh của Employee.
     * - Chỉ supervisor hoặc manager được thực hiện.
     *
     * Đồng thời giảm số booking hiện tại của slot để trả lại chỗ trống.
     * Không cộng điểm, không tăng lượt sử dụng và không xử lý Payment.
     */
    EmployeeQueueBookingResponseDTO markNoShow(
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
            Integer bookingId,
            Integer bayId
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
     * - Ghi nhận lượt sử dụng và tổng chi tiêu của Customer.
     * - Cộng điểm loyalty đúng một lần.
     * - Đánh giá lại hạng thành viên.
     *
     * Không xử lý Payment và không lưu phương thức thanh toán.
     * Employee chỉ bấm hoàn thành sau khi đã kiểm tra khách
     * thanh toán tại quầy.
     */
    EmployeeQueueBookingResponseDTO completeWash(
            Integer userId,
            Integer bookingId
    );
}