package com.autowash.backend.booking.controller;

import com.autowash.backend.booking.dto.BookingCreateRequestDTO;
import com.autowash.backend.booking.dto.BookingCreateResponseDTO;
import com.autowash.backend.booking.dto.BookingRescheduleRequestDTO;
import com.autowash.backend.booking.dto.BookingResponseDTO;
import com.autowash.backend.booking.dto.BookingSummaryResponseDTO;
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
 * API Booking dành cho Customer.
 *
 * Base URL:
 * /api/v1/bookings
 *
 * Nghiệp vụ Employee được xử lý riêng tại:
 * /api/v1/employee/**
 *
 * Nghiệp vụ Admin sẽ được xử lý riêng tại:
 * /api/v1/admin/bookings/**
 */
@RestController
@RequestMapping("/api/v1/bookings")
@RequiredArgsConstructor
@PreAuthorize("hasRole('CUSTOMER')")
public class BookingController {

    private final BookingService bookingService;

    // =========================================================
    // CREATE BOOKING
    // =========================================================

    /**
     * Customer tạo booking mới.
     *
     * POST /api/v1/bookings
     */
    @PostMapping
    public ResponseEntity<BookingCreateResponseDTO> createBooking(
            @Valid @RequestBody BookingCreateRequestDTO request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        BookingCreateResponseDTO response =
                bookingService.createBooking(
                        request,
                        userDetails.getId()
                );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    // =========================================================
    // MY BOOKINGS
    // =========================================================

    /**
     * Customer xem danh sách booking của mình.
     *
     * GET /api/v1/bookings/my/{customerId}
     */
    @GetMapping("/my/{customerId}")
    public ResponseEntity<List<BookingSummaryResponseDTO>> getMyBookings(
            @PathVariable Integer customerId,
            @RequestParam(required = false) Integer limit,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return ResponseEntity.ok(
                bookingService.getBookingsByCustomer(
                        customerId,
                        userDetails.getId(),
                        limit
                )
        );
    }

    // =========================================================
    // BOOKING DETAIL
    // =========================================================

    /**
     * Customer xem chi tiết booking của mình.
     *
     * GET /api/v1/bookings/{bookingId}
     */
    @GetMapping("/{bookingId}")
    public ResponseEntity<BookingResponseDTO> getBookingById(
            @PathVariable Integer bookingId,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return ResponseEntity.ok(
                bookingService.getBookingById(
                        bookingId,
                        userDetails.getId()
                )
        );
    }

    // =========================================================
    // CANCEL BOOKING
    // =========================================================

    /**
     * Customer hủy booking của chính mình.
     *
     * DELETE /api/v1/bookings/{bookingId}/cancel
     */
    @DeleteMapping("/{bookingId}/cancel")
    public ResponseEntity<BookingResponseDTO> cancelBooking(
            @PathVariable Integer bookingId,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return ResponseEntity.ok(
                bookingService.cancelOwnBooking(
                        bookingId,
                        userDetails.getId()
                )
        );
    }

    // =========================================================
    // RESCHEDULE BOOKING
    // =========================================================

    /**
     * Customer thay đổi khung giờ booking.
     *
     * Chỉ áp dụng khi booking đang ở trạng thái pending.
     *
     * PUT /api/v1/bookings/{bookingId}/reschedule
     */
    @PutMapping("/{bookingId}/reschedule")
    public ResponseEntity<BookingResponseDTO> rescheduleBooking(
            @PathVariable Integer bookingId,
            @Valid @RequestBody BookingRescheduleRequestDTO request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return ResponseEntity.ok(
                bookingService.rescheduleBooking(
                        bookingId,
                        userDetails.getId(),
                        request
                )
        );
    }
}