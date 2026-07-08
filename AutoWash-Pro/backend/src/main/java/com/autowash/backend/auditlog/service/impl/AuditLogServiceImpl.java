package com.autowash.backend.auditlog.service.impl;

import com.autowash.backend.auditlog.dto.AuditLogResponseDTO;
import com.autowash.backend.common.repository.AuditLogRepository;
import com.autowash.backend.auditlog.service.AuditLogService;
import com.autowash.backend.common.entity.AuditLog;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

@Service
@RequiredArgsConstructor
public class AuditLogServiceImpl implements AuditLogService {

    private final AuditLogRepository auditLogRepository;

    @Override
    public List<AuditLogResponseDTO> getAllLogs() {
        return auditLogRepository.findAllByOrderByTimestampDesc()
                .stream()
                .map(this::toDTO)
                .toList();
    }

    @Override
    public void log(String action, String performedBy, Integer targetUserId, String details) {
        AuditLog auditLog = AuditLog.builder()
                .action(action)
                .performedBy(performedBy)
                .targetUserId(targetUserId)
                .details(details)
                .build();

        auditLogRepository.save(auditLog);
    }

    @Override
    public void logCurrentUser(String action, Integer targetUserId, String details) {
        String performedBy = "system";

        Authentication authentication = SecurityContextHolder
                .getContext()
                .getAuthentication();

        if (authentication != null && authentication.isAuthenticated()) {
            performedBy = authentication.getName();
        }

        log(action, performedBy, targetUserId, details);
    }
    private AuditLogResponseDTO toDTO(AuditLog auditLog) {
        return AuditLogResponseDTO.builder()
                .id(auditLog.getId())
                .action(auditLog.getAction())
                .performedBy(auditLog.getPerformedBy())
                .targetUserId(auditLog.getTargetUserId())
                .details(auditLog.getDetails())
                .timestamp(auditLog.getTimestamp())
                .build();
    }
}