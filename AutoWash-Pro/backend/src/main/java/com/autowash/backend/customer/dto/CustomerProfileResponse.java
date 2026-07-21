package com.autowash.backend.customer.dto;

import com.autowash.backend.vehicle.dto.VehicleBriefResponse;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

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
    private String tierName;
    private LocalDateTime joinedAt;
    private List<VehicleBriefResponse> vehicles;
}
