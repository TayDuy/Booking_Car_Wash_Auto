package com.autowash.backend.booking.dto;

import com.autowash.backend.booking.entity.BookingDetail;
import lombok.*;
import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingDetailItemResponseDTO {

    private Integer bookingDetailId;
    private Integer bookingId;
    private Integer serviceId;
    private String serviceName;
    private String description;
    private Integer durationMinutes;
    private Integer quantity;
    private BigDecimal unitPrice;
    private BigDecimal subTotal;

    public static BookingDetailItemResponseDTO from(BookingDetail detail) {
        return BookingDetailItemResponseDTO.builder()
                .bookingDetailId(detail.getBookingDetailId())
                .bookingId(detail.getBooking().getBookingId())
                .serviceId(detail.getService().getServiceId())
                .serviceName(detail.getService().getServiceName())
                .description(detail.getService().getDescription())
                .durationMinutes(detail.getService().getDurationMinutes())
                .quantity(detail.getQuantity())
                .unitPrice(detail.getUnitPrice())
                .subTotal(detail.getSubTotal())
                .build();
    }
}