package com.autowash.backend.booking.service;

import com.autowash.backend.booking.dto.BookingDetailItemResponseDTO;
import com.autowash.backend.booking.dto.BookingDetailRequestDTO;
import java.util.List;

public interface BookingDetailService {
    BookingDetailItemResponseDTO addDetail(Integer bookingId, BookingDetailRequestDTO request);
    void removeDetail(Integer detailId);
    List<BookingDetailItemResponseDTO> getByBookingId(Integer bookingId);
    BookingDetailItemResponseDTO getById(Integer detailId);
}