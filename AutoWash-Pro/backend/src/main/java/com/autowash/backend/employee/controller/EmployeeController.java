package com.autowash.backend.employee.controller;

import com.autowash.backend.booking.enums.BookingStatus;
import com.autowash.backend.employee.dto.EmployeeBookingCreateRequestDTO;
import com.autowash.backend.employee.dto.EmployeeProfileResponseDTO;
import com.autowash.backend.employee.dto.EmployeeQueueBookingResponseDTO;
import com.autowash.backend.employee.service.EmployeeService;
import com.autowash.backend.security.CustomUserDetails;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/employee")
@RequiredArgsConstructor
@PreAuthorize("hasRole('EMPLOYEE')")
public class EmployeeController {

    private final EmployeeService employeeService;

    // =========================================================
    // PROFILE
    // =========================================================

    /**
     * GET /api/v1/employee/profile
     */
    @GetMapping("/profile")
    public ResponseEntity<EmployeeProfileResponseDTO> getMyProfile(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return ResponseEntity.ok(
                employeeService.getMyProfile(userDetails.getId())
        );
    }

    // =========================================================
    // QUEUE
    // =========================================================

    /**
     * GET /api/v1/employee/queue
     *
     * Ví dụ:
     * /queue
     * /queue?date=2026-07-13
     * /queue?status=confirmed
     * /queue?date=2026-07-13&status=checked_in
     */
    @GetMapping("/queue")
    public ResponseEntity<List<EmployeeQueueBookingResponseDTO>> getMyBranchQueue(
            @AuthenticationPrincipal CustomUserDetails userDetails,

            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate date,

            @RequestParam(required = false)
            BookingStatus status
    ) {
        return ResponseEntity.ok(
                employeeService.getMyBranchQueue(
                        userDetails.getId(),
                        date,
                        status
                )
        );
    }

    // =========================================================
    // BOOKING DETAIL
    // =========================================================

    /**
     * GET /api/v1/employee/bookings/{bookingId}
     */
    @GetMapping("/bookings/{bookingId}")
    public ResponseEntity<EmployeeQueueBookingResponseDTO> getBookingById(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Integer bookingId
    ) {
        return ResponseEntity.ok(
                employeeService.getMyBranchBookingById(
                        userDetails.getId(),
                        bookingId
                )
        );
    }

    /**
     * GET /api/v1/employee/bookings/search?bookingCode=...
     */
    @GetMapping("/bookings/search")
    public ResponseEntity<EmployeeQueueBookingResponseDTO> searchBooking(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam String bookingCode
    ) {
        return ResponseEntity.ok(
                employeeService.findMyBranchBookingByCode(
                        userDetails.getId(),
                        bookingCode
                )
        );
    }

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
     * Chi nhánh được lấy từ Employee đang đăng nhập,
     * frontend không được tự truyền branchId.
     *
     * POST /api/v1/employee/bookings
     */
    @PostMapping("/bookings")
    public ResponseEntity<EmployeeQueueBookingResponseDTO>
    createBookingForCustomer(
            @Valid @RequestBody
            EmployeeBookingCreateRequestDTO request,

            @AuthenticationPrincipal
            CustomUserDetails userDetails
    ) {
        EmployeeQueueBookingResponseDTO response =
                employeeService.createBookingForCustomer(
                        userDetails.getId(),
                        request
                );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }



    // =========================================================
    // CONFIRM
    // pending → confirmed
    // =========================================================

    /**
     * PATCH /api/v1/employee/bookings/{bookingId}/confirm
     *
     * Chỉ supervisor hoặc manager được phép xác nhận.
     */
    @PatchMapping("/bookings/{bookingId}/confirm")
    public ResponseEntity<EmployeeQueueBookingResponseDTO> confirmBooking(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Integer bookingId
    ) {
        return ResponseEntity.ok(
                employeeService.confirmBooking(
                        userDetails.getId(),
                        bookingId
                )
        );
    }

    // =========================================================
    // CHECK-IN
    // confirmed → checked_in
    // =========================================================

    /**
     * PATCH /api/v1/employee/bookings/{bookingId}/check-in
     */
    @PatchMapping("/bookings/{bookingId}/check-in")
    public ResponseEntity<EmployeeQueueBookingResponseDTO> checkInBooking(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Integer bookingId
    ) {
        return ResponseEntity.ok(
                employeeService.checkInBooking(
                        userDetails.getId(),
                        bookingId
                )
        );
    }

    // =========================================================
    // NO-SHOW
    // confirmed -> no_show
    // =========================================================

    /**
     * PATCH /api/v1/employee/bookings/{bookingId}/no-show
     *
     * Đánh dấu khách không đến sau thời gian chờ cho phép.
     * Service chịu trách nhiệm kiểm tra trạng thái, thời gian,
     * chi nhánh và quyền supervisor/manager.
     */
    @PatchMapping("/bookings/{bookingId}/no-show")
    public ResponseEntity<EmployeeQueueBookingResponseDTO> markNoShow(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Integer bookingId
    ) {
        return ResponseEntity.ok(
                employeeService.markNoShow(
                        userDetails.getId(),
                        bookingId
                )
        );
    }

    // =========================================================
    // START WASH
    // checked_in → in_progress
    // =========================================================

    /**
     * PATCH /api/v1/employee/bookings/{bookingId}/start-wash
     *
     * Gán Employee hiện tại vào assignedStaff
     * và chuyển wash bay sang occupied.
     *
     * @param bayId (tùy chọn) Chuyển booking sang wash bay khác
     *              khi bay hiện tại đang occupied.
     */
    @PatchMapping("/bookings/{bookingId}/start-wash")
    public ResponseEntity<EmployeeQueueBookingResponseDTO> startWash(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Integer bookingId,
            @RequestParam(required = false) Integer bayId
    ) {
        return ResponseEntity.ok(
                employeeService.startWash(
                        userDetails.getId(),
                        bookingId,
                        bayId
                )
        );
    }

    // =========================================================
    // COMPLETE
    // in_progress → completed
    // =========================================================

    /**
     * PATCH /api/v1/employee/bookings/{bookingId}/complete
     *
     * Employee chỉ gọi API sau khi đã xác nhận khách thanh toán tại quầy.
     * Service ghi completeAt, giải phóng wash bay, cộng điểm đúng một lần
     * và đánh giá lại hạng thành viên. Không tạo Payment.
     */
    @PatchMapping("/bookings/{bookingId}/complete")
    public ResponseEntity<EmployeeQueueBookingResponseDTO> completeWash(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Integer bookingId
    ) {
        return ResponseEntity.ok(
                employeeService.completeWash(
                        userDetails.getId(),
                        bookingId
                )
        );
    }
}