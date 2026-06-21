package com.autowash.backend.user.controller;

import com.autowash.backend.common.dto.ApiResponse;
import com.autowash.backend.common.entity.AuditLog;
import com.autowash.backend.common.repository.AuditLogRepository;
import com.autowash.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import com.autowash.backend.user.entity.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/users")
@RequiredArgsConstructor
public class AdminUserController {
    private final UserRepository userRepository;
    private final AuditLogRepository auditLogRepository;

    @PreAuthorize("hasRole('ADMIN')")//chỉ admin mới có quyền đổi role
    @PutMapping("/{id}/role")
    public ResponseEntity<ApiResponse<String>> updateUserRole(
            @PathVariable Integer id,
            @RequestParam String newRole,
            @AuthenticationPrincipal UserDetails currentUser //@AuthenticationPrincipal = Lấy thông tin Admin đang đăng nhập
            ){
        //ném lỗi nếu k tìm thấy user cần đổi quyền
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy user"));
        //lưu lại quyền cũ
        String oldRole = user.getRole();

        user.setRole(newRole.toLowerCase());
        userRepository.save(user);

        auditLogRepository.save(AuditLog.builder()
                        .action("CHANGE_ROLE")
                        .performedBy(currentUser.getUsername())
                        .targetUserId(id)
                        .details(oldRole +" -> "+newRole)
                .build());
        return ResponseEntity.ok(ApiResponse.success("Đổi quyền thành công: " + oldRole + " -> " +newRole, null));
    }



}
