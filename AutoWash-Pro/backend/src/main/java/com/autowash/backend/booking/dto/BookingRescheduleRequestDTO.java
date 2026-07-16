package com.autowash.backend.booking.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingRescheduleRequestDTO {

    private Integer newSlotId;

    @Size(max = 255)
    private String note;

    @AssertTrue(message = "Phải cung cấp ít nhất một trong hai: newSlotId hoặc note")
    public boolean isAtLeastOneFieldProvided() {
        return newSlotId != null || (note != null && !note.isBlank());
    }
}
