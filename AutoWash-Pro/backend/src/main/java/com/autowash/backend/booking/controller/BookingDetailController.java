package com.autowash.backend.booking.controller;

import com.autowash.backend.booking.dto.BookingDetailRequestDTO;
import com.autowash.backend.booking.dto.BookingDetailItemResponseDTO;
import com.autowash.backend.booking.service.BookingDetailService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * BookingDetailController
 * Quản lý các dịch vụ chi tiết bên trong một booking (thêm, xóa, xem).
 */
@RestController
@RequestMapping("/api/v1/bookings")
@RequiredArgsConstructor
public class BookingDetailController {

    private final BookingDetailService bookingDetailService;

    /**
     * Lấy danh sách các dịch vụ của một booking cụ thể.
     * GET: /api/v1/bookings/{bookingId}/details
     */
    @GetMapping("/{bookingId}/details")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'STAFF', 'ADMIN')")
    public ResponseEntity<List<BookingDetailItemResponseDTO>> getDetailsByBookingId(
            @PathVariable Integer bookingId) {

        return ResponseEntity.ok(bookingDetailService.getByBookingId(bookingId));
    }

    /**
     * Thêm một dịch vụ mới vào booking (chỉ cho phép khi booking chưa bắt đầu).
     * POST: /api/v1/bookings/{bookingId}/details
     */
    @PostMapping("/{bookingId}/details")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<BookingDetailItemResponseDTO> addDetail(
            @PathVariable Integer bookingId,
            @Valid @RequestBody BookingDetailRequestDTO request) {

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(bookingDetailService.addDetail(bookingId, request));
    }

    /**
     * Xóa một dịch vụ ra khỏi booking.
     * DELETE: /api/v1/bookings/details/{detailId}
     */
    @DeleteMapping("/details/{detailId}")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<Void> removeDetail(@PathVariable Integer detailId) {

        bookingDetailService.removeDetail(detailId);
        return ResponseEntity.noContent().build(); // HTTP 204
    }

    /**
     * Xem thông tin chi tiết của một dòng dịch vụ cụ thể.
     * GET: /api/v1/bookings/details/{detailId}
     */
    @GetMapping("/details/{detailId}")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'STAFF', 'ADMIN')")
    public ResponseEntity<BookingDetailItemResponseDTO> getDetailById(@PathVariable Integer detailId) {

        return ResponseEntity.ok(bookingDetailService.getById(detailId));
    }
}