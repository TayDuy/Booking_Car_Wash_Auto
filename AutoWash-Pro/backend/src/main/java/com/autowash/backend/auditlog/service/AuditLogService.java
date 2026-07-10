package com.autowash.backend.auditlog.service;

import com.autowash.backend.auditlog.dto.AuditLogResponseDTO;
import java.util.List;

public interface AuditLogService {
    List<AuditLogResponseDTO> getAllLogs();

    void log(String action, String performedBy, Integer targetUserId, String details);

    void logCurrentUser(String action, Integer targetUserId, String details);
}