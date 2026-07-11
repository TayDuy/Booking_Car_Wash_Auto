package com.autowash.backend.booking.service;

import com.autowash.backend.booking.dto.BookingDetailItemResponseDTO;
import com.autowash.backend.booking.dto.BookingDetailRequestDTO;
import java.util.List;

public interface BookingDetailService {
    BookingDetailItemResponseDTO addDetail(Integer bookingId, BookingDetailRequestDTO request, Integer userId);
    void removeDetail(Integer detailId, Integer userId);
    List<BookingDetailItemResponseDTO> getByBookingId(Integer bookingId);
    List<BookingDetailItemResponseDTO> getByBookingId(Integer bookingId, Integer userId);
    BookingDetailItemResponseDTO getById(Integer detailId);
    BookingDetailItemResponseDTO getById(Integer detailId, Integer userId);
    java.math.BigDecimal calculateTotalAmount(Integer bookingId);
}