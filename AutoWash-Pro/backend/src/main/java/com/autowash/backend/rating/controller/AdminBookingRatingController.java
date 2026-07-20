package com.autowash.backend.rating.controller;

import com.autowash.backend.rating.dto.AdminBookingRatingResponseDTO;
import com.autowash.backend.rating.service.BookingRatingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/ratings")
@RequiredArgsConstructor
public class AdminBookingRatingController {

    private final BookingRatingService bookingRatingService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<List<AdminBookingRatingResponseDTO>> getAllRatings(
            @RequestParam(required = false) Integer stars,
            @RequestParam(required = false) String search) {
        List<AdminBookingRatingResponseDTO> response = bookingRatingService.getAllRatingsForAdmin(stars, search);
        return ResponseEntity.ok(response);
    }
}
