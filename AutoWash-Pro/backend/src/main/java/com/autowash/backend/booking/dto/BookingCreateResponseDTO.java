package com.autowash.backend.booking.dto;

import com.autowash.backend.booking.entity.Booking;
import com.autowash.backend.booking.entity.BookingDetail;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class BookingCreateResponseDTO {

    private Integer bookingId;
    private String bookingCode;
    private LocalDateTime bookingDate;
    private Booking.BookingStatus status;
    private BigDecimal totalAmount; // tổng tiền tất cả dịch vụ
    private String message;

    /**
     * Dùng sau khi tạo booking thành công.
     * Nhận thêm details để tính totalAmount = sum(subTotal).
     */
    public static BookingCreateResponseDTO fromEntity(Booking booking, List<BookingDetail> details) {

        BigDecimal totalAmount = details.stream()
                .map(BookingDetail::getSubTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return BookingCreateResponseDTO.builder()
                .bookingId(booking.getBookingId())
                .bookingCode(booking.getBookingCode())
                .bookingDate(booking.getBookingDate())
                .status(booking.getStatus())
                .totalAmount(totalAmount)
                .message("Booking đã được tạo thành công, đang chờ xác nhận.")
                .build();
    }
}