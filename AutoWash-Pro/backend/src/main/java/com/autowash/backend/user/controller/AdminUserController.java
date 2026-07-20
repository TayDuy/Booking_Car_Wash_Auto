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
import com.autowash.backend.user.dto.AdminUserResponseDTO;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/users")
@RequiredArgsConstructor
public class AdminUserController {
    private final UserRepository userRepository;
    private final AuditLogRepository auditLogRepository;

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<List<AdminUserResponseDTO>>> getAllUsers() {

        List<AdminUserResponseDTO> users = userRepository.findAll()
                .stream()
                .map(user -> AdminUserResponseDTO.builder()
                        .id(user.getId())
                        .username(user.getUsername())
                        .email(user.getEmail())
                        .phone(user.getPhone())
                        .role(user.getRole())
                        .status(user.getStatus())
                        .createdAt(user.getCreatedAt())
                        .build())
                .toList();

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Lấy danh sách người dùng thành công",
                        users
                )
        );
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}/status")
    @Transactional
    public ResponseEntity<ApiResponse<String>> updateUserStatus(
            @PathVariable("id") Integer id,
            @RequestParam(name = "status") String status,
            @AuthenticationPrincipal UserDetails currentUser
    ) {
        User targetUser = userRepository.findById(id)
                .orElseThrow(() ->
                        new BusinessException(
                                "Không tìm thấy user",
                                HttpStatus.NOT_FOUND
                        )
                );

        com.autowash.backend.security.CustomUserDetails customUser =
                (com.autowash.backend.security.CustomUserDetails) currentUser;

        if (targetUser.getId().equals(customUser.getId())) {
            throw new BusinessException(
                    "Không thể tự khóa tài khoản của chính mình",
                    HttpStatus.BAD_REQUEST
            );
        }

        String normalizedStatus = status.toLowerCase();

        if (!normalizedStatus.equals("active")
                && !normalizedStatus.equals("inactive")) {
            throw new BusinessException(
                    "Trạng thái không hợp lệ. Chỉ cho phép active hoặc inactive",
                    HttpStatus.BAD_REQUEST
            );
        }

        String oldStatus = targetUser.getStatus();

        targetUser.setStatus(normalizedStatus);
        userRepository.save(targetUser);

        auditLogRepository.save(
                AuditLog.builder()
                        .action("CHANGE_STATUS")
                        .performedBy(currentUser.getUsername())
                        .targetUserId(id)
                        .details(oldStatus + " -> " + normalizedStatus)
                        .build()
        );

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Cập nhật trạng thái thành công",
                        null
                )
        );
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}/role")
    @Transactional
    public ResponseEntity<ApiResponse<String>> updateUserRole(
            @PathVariable("id") Integer id,
            @RequestParam(name = "newRole") String newRole,
            @AuthenticationPrincipal UserDetails currentUser
    ) {
        User targetUser = userRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Không tìm thấy user", HttpStatus.NOT_FOUND));

        com.autowash.backend.security.CustomUserDetails customUser =
                (com.autowash.backend.security.CustomUserDetails) currentUser;
        if (targetUser.getId().equals(customUser.getId())) {
            throw new BusinessException("Không thể tự thay đổi quyền của chính mình", HttpStatus.BAD_REQUEST);
        }

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