package com.autowash.backend.booking.service;

import com.autowash.backend.booking.dto.*;

import java.util.List;

public interface BookingService {

    BookingCreateResponseDTO createBooking(BookingCreateRequestDTO request, Integer userId);

    BookingResponseDTO getBookingById(Integer bookingId, Integer userId);

    List<BookingSummaryResponseDTO> getAllBookings();

    List<BookingSummaryResponseDTO> getBookingsByCustomer(Integer customerId, Integer userId);

    BookingResponseDTO updateBooking(
            Integer bookingId,
            BookingUpdateRequestDTO request
    );

    BookingResponseDTO cancelBooking(Integer bookingId, Integer userId);

    BookingResponseDTO completeBooking(Integer bookingId);
}