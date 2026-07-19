package com.autowash.backend.report.service;

import com.autowash.backend.report.dto.DashboardReportDTO;
import java.time.LocalDate;

public interface ReportService {
    DashboardReportDTO getDashboardReport(
        LocalDate fromDate,
        LocalDate toDate
    );
}