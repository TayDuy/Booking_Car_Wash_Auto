package com.autowash.backend.booking.controller;

import com.autowash.backend.booking.dto.BookingResponseDTO;
import com.autowash.backend.booking.dto.BookingSummaryResponseDTO;
import com.autowash.backend.booking.dto.BookingUpdateRequestDTO;
import com.autowash.backend.booking.service.BookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;
import com.autowash.backend.booking.dto.BookingCreateRequestDTO;
import com.autowash.backend.booking.dto.BookingCreateResponseDTO;
import com.autowash.backend.booking.dto.AssignableStaffResponseDTO;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/bookings")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminBookingController {

    private final BookingService bookingService;

    /**
     * Admin lấy toàn bộ booking.
     *
     * GET /api/v1/admin/bookings
     */
    @GetMapping
    public ResponseEntity<List<BookingSummaryResponseDTO>> getAllBookings() {
        return ResponseEntity.ok(
                bookingService.getAllBookings()
        );
    }

    /**
     * Admin xem chi tiết một booking.
     *
     * GET /api/v1/admin/bookings/{bookingId}
     *
     * Truyền userId = null để bỏ kiểm tra booking thuộc Customer nào.
     */
    @GetMapping("/{bookingId}")
    public ResponseEntity<BookingResponseDTO> getBookingById(
            @PathVariable Integer bookingId
    ) {
        return ResponseEntity.ok(
                bookingService.getBookingById(
                        bookingId,
                        null
                )
        );
    }

    /**
     * Admin lấy nhân viên có thể phân công cho booking.
     *
     * GET /api/v1/admin/bookings/{bookingId}/assignable-staff
     */
    @GetMapping("/{bookingId}/assignable-staff")
    public ResponseEntity<List<AssignableStaffResponseDTO>>
    getAssignableStaff(
            @PathVariable Integer bookingId
    ) {
        return ResponseEntity.ok(
                bookingService.getAssignableStaff(bookingId)
        );
    }

    /**
     * Admin cập nhật booking.
     *
     * PUT /api/v1/admin/bookings/{bookingId}
     */
    @PutMapping("/{bookingId}")
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
     * Admin hủy booking.
     *
     * DELETE /api/v1/admin/bookings/{bookingId}/cancel
     */
    @DeleteMapping("/{bookingId}/cancel")
    public ResponseEntity<BookingResponseDTO> cancelBooking(
            @PathVariable Integer bookingId
    ) {
        return ResponseEntity.ok(
                bookingService.cancelBooking(
                        bookingId,
                        null
                )
        );
    }

    /**
     * Admin xác nhận booking.
     *
     * PATCH /api/v1/admin/bookings/{bookingId}/confirm
     */
    @PatchMapping("/{bookingId}/confirm")
    public ResponseEntity<BookingResponseDTO> confirmBooking(
            @PathVariable Integer bookingId
    ) {
        return ResponseEntity.ok(
                bookingService.confirmBooking(bookingId)
        );
    }

    /**
     * Admin check-in booking.
     *
     * PATCH /api/v1/admin/bookings/{bookingId}/check-in
     */
    @PatchMapping("/{bookingId}/check-in")
    public ResponseEntity<BookingResponseDTO> checkInBooking(
            @PathVariable Integer bookingId
    ) {
        return ResponseEntity.ok(
                bookingService.checkInBooking(bookingId)
        );
    }

    /**
     * Admin bắt đầu thực hiện dịch vụ.
     *
     * PATCH /api/v1/admin/bookings/{bookingId}/start-wash
     */
    @PatchMapping("/{bookingId}/start-wash")
    public ResponseEntity<BookingResponseDTO> startWashBooking(
            @PathVariable Integer bookingId
    ) {
        return ResponseEntity.ok(
                bookingService.startWashBooking(bookingId)
        );
    }

    /**
     * Admin hoàn thành booking.
     *
     * PATCH /api/v1/admin/bookings/{bookingId}/complete
     */
    @PatchMapping("/{bookingId}/complete")
    public ResponseEntity<BookingResponseDTO> completeBooking(
            @PathVariable Integer bookingId
    ) {
        return ResponseEntity.ok(
                bookingService.completeBooking(bookingId)
        );
    }

    /**
     * Admin tạo booking cho khách hàng.
     *
     * POST /api/v1/admin/bookings
     */
    @PostMapping
    public ResponseEntity<BookingCreateResponseDTO> createBooking(
            @Valid @RequestBody BookingCreateRequestDTO request
    ) {
        BookingCreateResponseDTO response =
                bookingService.createBooking(request, null);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }
}