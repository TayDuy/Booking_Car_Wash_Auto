package com.autowash.backend.booking.controller;

import com.autowash.backend.booking.dto.BookingDetailRequestDTO;
import com.autowash.backend.booking.dto.BookingDetailItemResponseDTO;
import com.autowash.backend.booking.service.BookingDetailService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import com.autowash.backend.security.CustomUserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/bookings")
@RequiredArgsConstructor
public class BookingDetailController {

    private final BookingDetailService bookingDetailService;

    @GetMapping("/{bookingId}/details")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'EMPLOYEE', 'ADMIN')")
    public ResponseEntity<List<BookingDetailItemResponseDTO>> getDetailsByBookingId(
            @PathVariable("bookingId") Integer bookingId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        boolean isStaffOrAdmin = userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_EMPLOYEE"));
        Integer userId = isStaffOrAdmin ? null : userDetails.getId();
        return ResponseEntity.ok(bookingDetailService.getByBookingId(bookingId, userId));
    }

    @PostMapping("/{bookingId}/details")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<BookingDetailItemResponseDTO> addDetail(
            @PathVariable("bookingId") Integer bookingId,
            @Valid @RequestBody BookingDetailRequestDTO request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(bookingDetailService.addDetail(bookingId, request, userDetails.getId()));
    }

    @DeleteMapping("/details/{detailId}")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<Void> removeDetail(
            @PathVariable("detailId") Integer detailId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        bookingDetailService.removeDetail(detailId, userDetails.getId());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/details/{detailId}")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'EMPLOYEE', 'ADMIN')")
    public ResponseEntity<BookingDetailItemResponseDTO> getDetailById(
            @PathVariable("detailId") Integer detailId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        boolean isStaffOrAdmin = userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_EMPLOYEE"));
        Integer userId = isStaffOrAdmin ? null : userDetails.getId();
        return ResponseEntity.ok(bookingDetailService.getById(detailId, userId));
    }
}