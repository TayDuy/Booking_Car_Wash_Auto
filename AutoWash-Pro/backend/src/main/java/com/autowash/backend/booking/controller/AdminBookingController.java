package com.autowash.backend.booking.controller;

import com.autowash.backend.booking.dto.BookingResponseDTO;
import com.autowash.backend.booking.dto.BookingSummaryResponseDTO;
import com.autowash.backend.booking.dto.BookingUpdateRequestDTO;
import com.autowash.backend.booking.service.BookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;
import com.autowash.backend.booking.dto.BookingCreateRequestDTO;
import com.autowash.backend.booking.dto.BookingCreateResponseDTO;
import com.autowash.backend.booking.dto.AssignableStaffResponseDTO;
import com.autowash.backend.booking.dto.OrderStatisticsDTO;
import com.autowash.backend.booking.enums.BookingSortOption;
import com.autowash.backend.booking.enums.BookingStatus;
import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/bookings")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminBookingController {

    private final BookingService bookingService;

    @GetMapping
    public ResponseEntity<Page<BookingSummaryResponseDTO>> getAllBookings(
            @RequestParam(required = false, name = "sortBy") String sortBy,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(
                bookingService.getAllBookings(
                        BookingSortOption.fromParam(sortBy),
                        pageable
                )
        );
    }

    @GetMapping("/orders")
    public ResponseEntity<Page<BookingSummaryResponseDTO>> getAllOrders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(
                bookingService.getAllOrders(
                        List.of(
                                BookingStatus.checked_in,
                                BookingStatus.in_progress,
                                BookingStatus.completed
                        ),
                        pageable
                )
        );
    }

    @GetMapping("/orders/statistics")
    public ResponseEntity<OrderStatisticsDTO> getOrderStatistics() {
        return ResponseEntity.ok(
                bookingService.getOrderStatistics(
                        List.of(
                                BookingStatus.checked_in,
                                BookingStatus.in_progress,
                                BookingStatus.completed
                        )
                )
        );
    }

    @GetMapping("/{bookingId}")
    public ResponseEntity<BookingResponseDTO> getBookingById(
            @PathVariable("bookingId") Integer bookingId
    ) {
        return ResponseEntity.ok(
                bookingService.getBookingById(
                        bookingId,
                        null
                )
        );
    }

    @GetMapping("/{bookingId}/assignable-staff")
    public ResponseEntity<List<AssignableStaffResponseDTO>>
    getAssignableStaff(
            @PathVariable("bookingId") Integer bookingId
    ) {
        return ResponseEntity.ok(
                bookingService.getAssignableStaff(bookingId)
        );
    }

    @PutMapping("/{bookingId}")
    public ResponseEntity<BookingResponseDTO> updateBooking(
            @PathVariable("bookingId") Integer bookingId,
            @Valid @RequestBody BookingUpdateRequestDTO request
    ) {
        return ResponseEntity.ok(
                bookingService.updateBooking(
                        bookingId,
                        request
                )
        );
    }

    @DeleteMapping("/{bookingId}/cancel")
    public ResponseEntity<BookingResponseDTO> cancelBooking(
            @PathVariable("bookingId") Integer bookingId
    ) {
        return ResponseEntity.ok(
                bookingService.cancelBooking(
                        bookingId,
                        null
                )
        );
    }

    @PatchMapping("/{bookingId}/confirm")
    public ResponseEntity<BookingResponseDTO> confirmBooking(
            @PathVariable("bookingId") Integer bookingId
    ) {
        return ResponseEntity.ok(
                bookingService.confirmBooking(bookingId)
        );
    }

    @PatchMapping("/{bookingId}/check-in")
    public ResponseEntity<BookingResponseDTO> checkInBooking(
            @PathVariable("bookingId") Integer bookingId
    ) {
        return ResponseEntity.ok(
                bookingService.checkInBooking(bookingId)
        );
    }

    @PatchMapping("/{bookingId}/start-wash")
    public ResponseEntity<BookingResponseDTO> startWashBooking(
            @PathVariable("bookingId") Integer bookingId
    ) {
        return ResponseEntity.ok(
                bookingService.startWashBooking(bookingId)
        );
    }

    @PatchMapping("/{bookingId}/complete")
    public ResponseEntity<BookingResponseDTO> completeBooking(
            @PathVariable("bookingId") Integer bookingId
    ) {
        return ResponseEntity.ok(
                bookingService.completeBooking(bookingId)
        );
    }

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