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

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    // ==========================================================
    // CUSTOMER APIs
    // ==========================================================

    /**
     * CUSTOMER tạo booking mới.
     *
     * POST /api/v1/customer/bookings
     */
    @PostMapping("/customer/bookings")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<BookingCreateResponseDTO> createBooking(
            @Valid @RequestBody BookingCreateRequestDTO request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        BookingCreateResponseDTO response =
                bookingService.createBooking(request, userDetails.getId());

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    /**
     * CUSTOMER xem danh sách booking của mình.
     *
     * GET /api/v1/customer/bookings/my/{customerId}
     */
    @GetMapping("/customer/bookings/my/{customerId}")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<List<BookingSummaryResponseDTO>> getMyBookings(
            @PathVariable Integer customerId,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return ResponseEntity.ok(
                bookingService.getBookingsByCustomer(customerId, userDetails.getId())
        );
    }

    /**
     * CUSTOMER xem chi tiết booking của mình.
     *
     * GET /api/v1/customer/bookings/{bookingId}
     */
    @GetMapping("/customer/bookings/{bookingId}")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<BookingResponseDTO> getMyBookingById(
            @PathVariable Integer bookingId,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return ResponseEntity.ok(
                bookingService.getBookingById(bookingId, userDetails.getId())
        );
    }

    /**
     * CUSTOMER hủy booking của mình.
     *
     * PATCH /api/v1/customer/bookings/{bookingId}/cancel
     */
    @PatchMapping("/customer/bookings/{bookingId}/cancel")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<BookingResponseDTO> cancelMyBooking(
            @PathVariable Integer bookingId,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return ResponseEntity.ok(
                bookingService.cancelBooking(bookingId, userDetails.getId())
        );
    }

    // ==========================================================
    // STAFF APIs
    // ADMIN cũng được quyền gọi các API staff
    // ==========================================================

    /**
     * STAFF / ADMIN xem toàn bộ booking.
     *
     * GET /api/v1/staff/bookings
     */
    @GetMapping("/staff/bookings")
    @PreAuthorize("hasAnyRole('STAFF','ADMIN')")
    public ResponseEntity<List<BookingSummaryResponseDTO>> getAllBookingsForStaff() {
        return ResponseEntity.ok(
                bookingService.getAllBookings()
        );
    }

    /**
     * STAFF / ADMIN cập nhật booking.
     *
     * PUT /api/v1/staff/bookings/{bookingId}
     */
    @PutMapping("/staff/bookings/{bookingId}")
    @PreAuthorize("hasAnyRole('STAFF','ADMIN')")
    public ResponseEntity<BookingResponseDTO> updateBookingByStaff(
            @PathVariable Integer bookingId,
            @Valid @RequestBody BookingUpdateRequestDTO request
    ) {
        return ResponseEntity.ok(
                bookingService.updateBooking(bookingId, request)
        );
    }

    /**
     * STAFF / ADMIN xác nhận booking.
     *
     * PATCH /api/v1/staff/bookings/{bookingId}/confirm
     */
    @PatchMapping("/staff/bookings/{bookingId}/confirm")
    @PreAuthorize("hasAnyRole('STAFF','ADMIN')")
    public ResponseEntity<BookingResponseDTO> confirmBooking(
            @PathVariable Integer bookingId
    ) {
        return ResponseEntity.ok(
                bookingService.confirmBooking(bookingId)
        );
    }

    /**
     * STAFF / ADMIN check-in xe khi khách tới chi nhánh.
     *
     * PATCH /api/v1/staff/bookings/{bookingId}/check-in
     */
    @PatchMapping("/staff/bookings/{bookingId}/check-in")
    @PreAuthorize("hasAnyRole('STAFF','ADMIN')")
    public ResponseEntity<BookingResponseDTO> checkInBooking(
            @PathVariable Integer bookingId
    ) {
        return ResponseEntity.ok(
                bookingService.checkInBooking(bookingId)
        );
    }

    /**
     * STAFF / ADMIN hoàn thành booking.
     * Khi completed thì backend mới cộng điểm loyalty.
     *
     * PATCH /api/v1/staff/bookings/{bookingId}/complete
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

    /**
     * STAFF / ADMIN hủy booking bất kỳ.
     *
     * PATCH /api/v1/staff/bookings/{bookingId}/cancel
     */
    @PatchMapping("/staff/bookings/{bookingId}/cancel")
    @PreAuthorize("hasAnyRole('STAFF','ADMIN')")
    public ResponseEntity<BookingResponseDTO> cancelBookingByStaff(
            @PathVariable Integer bookingId
    ) {
        return ResponseEntity.ok(
                bookingService.cancelBooking(bookingId, null)
        );
    }

    // ==========================================================
    // ADMIN APIs
    // ==========================================================

    /**
     * ADMIN xem toàn bộ booking.
     *
     * GET /api/v1/admin/bookings
     */
    @GetMapping("/admin/bookings")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<BookingSummaryResponseDTO>> getAllBookingsForAdmin() {
        return ResponseEntity.ok(
                bookingService.getAllBookings()
        );
    }

    /**
     * ADMIN cập nhật booking.
     *
     * PUT /api/v1/admin/bookings/{bookingId}
     */
    @PutMapping("/admin/bookings/{bookingId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BookingResponseDTO> updateBookingByAdmin(
            @PathVariable Integer bookingId,
            @Valid @RequestBody BookingUpdateRequestDTO request
    ) {
        return ResponseEntity.ok(
                bookingService.updateBooking(bookingId, request)
        );
    }

    /**
     * ADMIN hủy booking bất kỳ.
     *
     * PATCH /api/v1/admin/bookings/{bookingId}/cancel
     */
    @PatchMapping("/admin/bookings/{bookingId}/cancel")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BookingResponseDTO> cancelBookingByAdmin(
            @PathVariable Integer bookingId
    ) {
        return ResponseEntity.ok(
                bookingService.cancelBooking(bookingId, null)
        );
    }
}