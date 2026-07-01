package com.autowash.backend.booking.dto;

import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingUpdateRequestDTO {

    private Integer assignedStaffId; //employee

    @Size(max = 255)
    private String note;
}