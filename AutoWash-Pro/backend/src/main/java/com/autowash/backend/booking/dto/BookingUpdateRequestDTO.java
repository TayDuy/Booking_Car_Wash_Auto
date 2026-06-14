package com.autowash.backend.booking.dto;

import com.autowash.backend.booking.enums.BookingStatus;
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

    private BookingStatus status;

    private LocalDateTime startTime;

    private LocalDateTime endTime;

    @Size(max = 255)
    private String note;
}