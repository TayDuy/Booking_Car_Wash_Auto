package com.autowash.backend.booking.controller;

import com.autowash.backend.booking.dto.BookingCreateRequestDTO;
import com.autowash.backend.booking.dto.BookingCreateResponseDTO;
import com.autowash.backend.booking.dto.BookingResponseDTO;
import com.autowash.backend.booking.dto.BookingSummaryResponseDTO;
import com.autowash.backend.booking.dto.BookingUpdateRequestDTO;
import com.autowash.backend.booking.service.BookingService;
import com.autowash.backend.security.CustomUserDetails;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * ==========================================================
 * BOOKING CONTROLLER
 * ==========================================================
 *
 * CUSTOMER:
 * - Tạo booking
 * - Xem booking của mình
 * - Xem chi tiết booking
 * - Hủy booking
 *
 * STAFF / ADMIN:
 * - Xem tất cả booking
 * - Cập nhật booking
 * - Hủy booking bất kỳ
 *
 * URL base:
 * /api/v1
 */
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class BookingController {

    /**
     * Spring tự inject BookingServiceImpl
     * vì BookingServiceImpl implements BookingService
     */
    private final BookingService bookingService;

    // ==========================================================
    // CUSTOMER APIs
    // ==========================================================

    /**
     * CUSTOMER tạo booking mới
     *
     * POST:
     * /api/v1/bookings
     */
    @PostMapping("/bookings")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<BookingCreateResponseDTO> createBooking(
            @Valid @RequestBody BookingCreateRequestDTO request
    ) {

        BookingCreateResponseDTO response =
                bookingService.createBooking(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    /**
     * CUSTOMER xem danh sách booking của mình
     *
     * GET:
     * /api/v1/bookings/my/{customerId}
     */
    @GetMapping("/bookings/my/{customerId}")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<List<BookingSummaryResponseDTO>> getMyBookings(
            @PathVariable Integer customerId
    ) {

        return ResponseEntity.ok(
                bookingService.getBookingsByCustomer(customerId)
        );
    }

    /**
     * CUSTOMER xem chi tiết booking
     *
     * GET:
     * /api/v1/bookings/{bookingId}
     */
    @GetMapping("/bookings/{bookingId}")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<BookingResponseDTO> getBookingById(
            @PathVariable Integer bookingId
    ) {

        return ResponseEntity.ok(
                bookingService.getBookingById(bookingId)
        );
    }

    /**
     * CUSTOMER hủy booking
     *
     * FIX: trước đây không kiểm tra bookingId có thuộc khách đang đăng nhập
     * hay không → giờ bắt buộc truyền userId lấy từ token để service verify.
     *
     * DELETE:
     * /api/v1/bookings/{bookingId}/cancel
     */
    @DeleteMapping("/bookings/{bookingId}/cancel")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<BookingResponseDTO> cancelBooking(
            @PathVariable Integer bookingId,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {

        return ResponseEntity.ok(
                bookingService.cancelOwnBooking(bookingId, userDetails.getId())
        );
    }

    // ==========================================================
    // STAFF / ADMIN APIs
    // ==========================================================

    /**
     * STAFF / ADMIN tạo booking hộ khách hàng
     * (khách walk-in tại quầy, đặt lịch qua điện thoại, v.v).
     *
     * Dùng chung DTO/logic với luồng khách tự đặt — request đã có sẵn
     * customerId nên chỉ cần khác quyền truy cập (STAFF/ADMIN thay vì CUSTOMER).
     *
     * POST:
     * /api/v1/staff/bookings
     */
    @PostMapping("/staff/bookings")
    @PreAuthorize("hasAnyRole('STAFF','ADMIN')")
    public ResponseEntity<BookingCreateResponseDTO> createBookingByStaff(
            @Valid @RequestBody BookingCreateRequestDTO request
    ) {

        BookingCreateResponseDTO response =
                bookingService.createBooking(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    /**
     * Xem toàn bộ booking
     *
     * GET:
     * /api/v1/staff/bookings
     */
    @GetMapping("/staff/bookings")
    @PreAuthorize("hasAnyRole('STAFF','ADMIN')")
    public ResponseEntity<List<BookingSummaryResponseDTO>> getAllBookings() {

        return ResponseEntity.ok(
                bookingService.getAllBookings()
        );
    }

    /**
     * STAFF / ADMIN cập nhật booking
     *
     * PUT:
     * /api/v1/staff/bookings/{bookingId}
     */
    @PutMapping("/staff/bookings/{bookingId}")
    @PreAuthorize("hasAnyRole('STAFF','ADMIN')")
    public ResponseEntity<BookingResponseDTO> updateBooking(
            @PathVariable Integer bookingId,
            @Valid @RequestBody BookingUpdateRequestDTO request
    ) {

        return ResponseEntity.ok(
                bookingService.updateBooking(
                        bookingId,
                        request
                )
        );
    }

    /**
     * STAFF / ADMIN hủy booking bất kỳ
     *
     * DELETE:
     * /api/v1/staff/bookings/{bookingId}/cancel
     */
    @DeleteMapping("/staff/bookings/{bookingId}/cancel")
    @PreAuthorize("hasAnyRole('STAFF','ADMIN')")
    public ResponseEntity<BookingResponseDTO> cancelBookingByStaff(
            @PathVariable Integer bookingId
    ) {

        return ResponseEntity.ok(
                bookingService.cancelBooking(bookingId)
        );
    }

    /**
     * STAFF / ADMIN hoàn thành booking
     *
     * PATCH:
     * /api/v1/staff/bookings/{bookingId}/complete
     */
    @PatchMapping("/staff/bookings/{bookingId}/complete")
    @PreAuthorize("hasAnyRole('STAFF','ADMIN')")
    public ResponseEntity<BookingResponseDTO> completeBooking(
            @PathVariable Integer bookingId
    ) {

        return ResponseEntity.ok(
                bookingService.completeBooking(bookingId)
        );
    }
}