package com.autowash.backend.report.controller;

import com.autowash.backend.report.dto.DashboardReportDTO;
import com.autowash.backend.report.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/dashboard")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<DashboardReportDTO> getDashboardReport() {
        return ResponseEntity.ok(reportService.getDashboardReport());
    }
}