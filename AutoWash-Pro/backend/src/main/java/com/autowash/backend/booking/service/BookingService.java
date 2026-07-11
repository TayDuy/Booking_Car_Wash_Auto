package com.autowash.backend.booking.service;

import com.autowash.backend.booking.dto.*;

import java.util.List;

public interface BookingService {

    BookingCreateResponseDTO createBooking(BookingCreateRequestDTO request, Integer userId);

    BookingResponseDTO getBookingById(Integer bookingId, Integer userId);

    List<BookingSummaryResponseDTO> getAllBookings();

    List<BookingSummaryResponseDTO> getBookingsByCustomer(Integer customerId, Integer userId, Integer limit);

    BookingResponseDTO updateBooking(
            Integer bookingId,
            BookingUpdateRequestDTO request
    );

    BookingResponseDTO cancelBooking(Integer bookingId, Integer userId);

    /**
     * CUSTOMER hủy booking của chính mình — có kiểm tra quyền sở hữu.
     * userId là id của User đang đăng nhập (lấy từ CustomUserDetails).
     */
    BookingResponseDTO cancelOwnBooking(Integer bookingId, Integer userId);

    BookingResponseDTO confirmBooking(Integer bookingId);

    BookingResponseDTO checkInBooking(Integer bookingId);

    BookingResponseDTO completeBooking(Integer bookingId);

    BookingResponseDTO rescheduleBooking(Integer bookingId, Integer userId, BookingRescheduleRequestDTO request);
}