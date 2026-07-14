package com.autowash.backend.user.controller;

import com.autowash.backend.common.dto.ApiResponse;
import com.autowash.backend.common.entity.AuditLog;
import com.autowash.backend.common.repository.AuditLogRepository;
import com.autowash.backend.user.entity.User;
import com.autowash.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final UserRepository userRepository;
    private final AuditLogRepository auditLogRepository;

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public ResponseEntity<ApiResponse<List<User>>> getAllUsers() {
        return ResponseEntity.ok(
                ApiResponse.success(
                        "Lấy danh sách người dùng thành công",
                        userRepository.findAll()
                )
        );
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}/role")
    public ResponseEntity<ApiResponse<String>> updateUserRole(
            @PathVariable Integer id,
            @RequestParam String newRole,
            @AuthenticationPrincipal UserDetails currentUser
    ) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy user"));

        String oldRole = user.getRole();

        user.setRole(newRole.toLowerCase());
        userRepository.save(user);

        auditLogRepository.save(AuditLog.builder()
                .action("CHANGE_ROLE")
                .performedBy(currentUser.getUsername())
                .targetUserId(id)
                .details(oldRole + " -> " + newRole)
                .build());

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Đổi quyền thành công: " + oldRole + " -> " + newRole,
                        null
                )
        );
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}/status")
    public ResponseEntity<ApiResponse<String>> updateStatus(
            @PathVariable Integer id,
            @RequestParam String status,
            @AuthenticationPrincipal UserDetails currentUser
    ) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy user"));

        String oldStatus = user.getStatus();

        user.setStatus(status.toLowerCase());
        userRepository.save(user);

        auditLogRepository.save(AuditLog.builder()
                .action("CHANGE_STATUS")
                .performedBy(currentUser.getUsername())
                .targetUserId(id)
                .details(oldStatus + " -> " + status)
                .build());

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Đổi trạng thái thành công",
                        null
                )
        );
    }
}