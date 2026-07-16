package com.autowash.backend.auditlog.controller;

import com.autowash.backend.auditlog.dto.AuditLogResponseDTO;
import com.autowash.backend.auditlog.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/audit-logs")
@RequiredArgsConstructor
public class AuditLogController {

    private final AuditLogService auditLogService;

    @GetMapping
    @PreAuthorize("hasAnyRole('EMPLOYEE','ADMIN')")
    public ResponseEntity<List<AuditLogResponseDTO>> getAllLogs() {
        return ResponseEntity.ok(auditLogService.getAllLogs());
    }
}