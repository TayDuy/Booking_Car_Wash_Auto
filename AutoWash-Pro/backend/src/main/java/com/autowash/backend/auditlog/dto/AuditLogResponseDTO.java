package com.autowash.backend.auditlog.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class AuditLogResponseDTO {
    private Integer id;
    private String action;
    private String performedBy;
    private Integer targetUserId;
    private String details;
    private LocalDateTime timestamp;
}