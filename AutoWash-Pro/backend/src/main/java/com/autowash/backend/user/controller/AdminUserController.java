package com.autowash.backend.user.controller;

import com.autowash.backend.common.dto.ApiResponse;
import com.autowash.backend.common.entity.AuditLog;
import com.autowash.backend.common.exception.BusinessException;
import com.autowash.backend.common.repository.AuditLogRepository;
import com.autowash.backend.user.enums.Role;
import com.autowash.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import com.autowash.backend.user.entity.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/users")
@RequiredArgsConstructor
public class AdminUserController {
    private final UserRepository userRepository;
    private final AuditLogRepository auditLogRepository;

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}/role")
    @Transactional
    public ResponseEntity<ApiResponse<String>> updateUserRole(
            @PathVariable Integer id,
            @RequestParam String newRole,
            @AuthenticationPrincipal UserDetails currentUser
            ) {
        User targetUser = userRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Không tìm thấy user", HttpStatus.NOT_FOUND));

        // Prevent self-demotion
        com.autowash.backend.security.CustomUserDetails customUser =
                (com.autowash.backend.security.CustomUserDetails) currentUser;
        if (targetUser.getId().equals(customUser.getId())) {
            throw new BusinessException("Không thể tự thay đổi quyền của chính mình", HttpStatus.BAD_REQUEST);
        }

        // Validate newRole
        boolean isValidRole = false;
        for (Role r : Role.values()) {
            if (r.name().equalsIgnoreCase(newRole)) {
                isValidRole = true;
                break;
            }
        }
        if (!isValidRole) {
            throw new BusinessException(
                    "Role không hợp lệ. Cho phép: CUSTOMER, EMPLOYEE, ADMIN", HttpStatus.BAD_REQUEST);
        }

        String oldRole = targetUser.getRole();

        // Prevent demoting the last ADMIN
        String newRoleLower = newRole.toLowerCase();
        if (!"admin".equals(newRoleLower)) {
            long adminCount = userRepository.countByRole("admin");
            if ("admin".equals(oldRole) && adminCount <= 1) {
                throw new BusinessException(
                        "Không thể hạ quyền admin cuối cùng trong hệ thống", HttpStatus.BAD_REQUEST);
            }
        }

        targetUser.setRole(newRoleLower);
        userRepository.save(targetUser);

        auditLogRepository.save(AuditLog.builder()
                        .action("CHANGE_ROLE")
                        .performedBy(currentUser.getUsername())
                        .targetUserId(id)
                        .details(oldRole + " -> " + newRole)
                .build());
        return ResponseEntity.ok(ApiResponse.success("Đổi quyền thành công: " + oldRole + " -> " + newRole, null));
    }

}
