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

    /**
     * CUSTOMER hủy booking của chính mình — có kiểm tra quyền sở hữu.
     * userId là id của User đang đăng nhập (lấy từ CustomUserDetails).
     */
    BookingResponseDTO cancelOwnBooking(Integer bookingId, Integer userId);

    BookingResponseDTO completeBooking(Integer bookingId);
}