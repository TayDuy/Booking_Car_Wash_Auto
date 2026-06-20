package com.autowash.backend.booking.service;

import com.autowash.backend.booking.dto.*;

import java.util.List;

public interface BookingService {

    BookingCreateResponseDTO createBooking(BookingCreateRequestDTO request);

    BookingResponseDTO getBookingById(Integer bookingId);

    List<BookingSummaryResponseDTO> getAllBookings();

    List<BookingSummaryResponseDTO> getBookingsByCustomer(Integer customerId);

    BookingResponseDTO updateBooking(
            Integer bookingId,
            BookingUpdateRequestDTO request
    );

    BookingResponseDTO cancelBooking(Integer bookingId);

    BookingResponseDTO completeBooking(Integer bookingId);
}