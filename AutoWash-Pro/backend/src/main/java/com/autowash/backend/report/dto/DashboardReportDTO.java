package com.autowash.backend.report.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class DashboardReportDTO {
    private long totalBookings;
    private long completedBookings;
    private long pendingBookings;
    private long confirmedBookings;
    private long checkedInBookings;
    private long inProgressBookings;
    private long cancelledBookings;
    private long noShowBookings;

    private long totalCustomers;
    private long totalBranches;
    private long totalServices;

    private BigDecimal revenue;
}