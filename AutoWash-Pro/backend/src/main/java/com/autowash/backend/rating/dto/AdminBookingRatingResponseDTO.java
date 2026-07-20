package com.autowash.backend.rating.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminBookingRatingResponseDTO {
    private Integer ratingId;
    private Integer bookingId;
    private String bookingCode;
    private Integer customerId;
    private String customerName;
    private String customerPhone;
    private String customerEmail;
    private Integer ratingStars;
    private String comment;
    private LocalDateTime createdAt;
}
