package com.autowash.backend.rating.controller;

import com.autowash.backend.rating.dto.BookingRatingCreateRequestDTO;
import com.autowash.backend.rating.dto.BookingRatingResponseDTO;
import com.autowash.backend.rating.service.BookingRatingService;
import com.autowash.backend.security.CustomUserDetails;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/bookings/{bookingId}/rating")
@RequiredArgsConstructor
public class BookingRatingController {

    private final BookingRatingService bookingRatingService;

    @PostMapping
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<BookingRatingResponseDTO> createRating(
            @PathVariable Integer bookingId,
            @Valid @RequestBody BookingRatingCreateRequestDTO dto,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        Integer userId = userDetails != null ? userDetails.getId() : null;
        BookingRatingResponseDTO response = bookingRatingService.createRating(bookingId, dto, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('CUSTOMER', 'STAFF', 'ADMIN')")
    public ResponseEntity<BookingRatingResponseDTO> getRating(
            @PathVariable Integer bookingId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        Integer userId = userDetails != null ? userDetails.getId() : null;
        BookingRatingResponseDTO response = bookingRatingService.getRatingByBooking(bookingId, userId);
        return ResponseEntity.ok(response);
    }
}
