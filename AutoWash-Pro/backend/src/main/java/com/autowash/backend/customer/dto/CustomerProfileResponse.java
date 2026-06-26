package com.autowash.backend.customer.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class CustomerProfileResponse {

    private Integer customerId;
    private String username;
    private String email;
    private String phone;
    private String fullName;
    private LocalDate dateOfBirth;
    private String gender;
    private Integer totalPoints;
    private Integer totalVisits;
    private BigDecimal totalSpending;
    private Integer tierId;
    private LocalDateTime joinedAt;
}
