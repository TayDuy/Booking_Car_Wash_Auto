package com.autowash.backend.rating.service;

import com.autowash.backend.rating.dto.AdminBookingRatingResponseDTO;
import com.autowash.backend.rating.dto.BookingRatingCreateRequestDTO;
import com.autowash.backend.rating.dto.BookingRatingResponseDTO;

import java.util.List;

public interface BookingRatingService {

    BookingRatingResponseDTO createRating(Integer bookingId, BookingRatingCreateRequestDTO dto, Integer userId);

    BookingRatingResponseDTO getRatingByBooking(Integer bookingId, Integer userId);

    List<AdminBookingRatingResponseDTO> getAllRatingsForAdmin(Integer stars, String search);
}
