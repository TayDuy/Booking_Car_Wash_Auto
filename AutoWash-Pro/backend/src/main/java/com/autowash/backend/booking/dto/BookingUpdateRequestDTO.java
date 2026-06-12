package com.autowash.backend.booking.dto;

import com.autowash.backend.booking.entity.Booking;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingUpdateRequestDTO {

    private Integer assignedStaffId; //employee

    private Booking.BookingStatus status;

    private LocalDateTime startTime;

    private LocalDateTime endTime;

    @Size(max = 255)
    private String note;
}