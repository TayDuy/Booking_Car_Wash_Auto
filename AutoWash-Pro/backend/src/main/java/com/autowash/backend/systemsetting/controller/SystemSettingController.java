package com.autowash.backend.systemsetting.controller;

import com.autowash.backend.common.dto.ApiResponse;
import com.autowash.backend.systemsetting.dto.SystemSettingRequestDTO;
import com.autowash.backend.systemsetting.dto.SystemSettingResponseDTO;
import com.autowash.backend.systemsetting.service.SystemSettingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/settings")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class SystemSettingController {

    private final SystemSettingService service;

    @GetMapping
    public ResponseEntity<ApiResponse<SystemSettingResponseDTO>>
    getSettings() {
        return ResponseEntity.ok(
                ApiResponse.success(
                        "Lấy cấu hình thành công",
                        service.getSettings()
                )
        );
    }

    @PutMapping
    public ResponseEntity<ApiResponse<SystemSettingResponseDTO>>
    updateSettings(
            @RequestBody SystemSettingRequestDTO request
    ) {
        return ResponseEntity.ok(
                ApiResponse.success(
                        "Cập nhật cấu hình thành công",
                        service.updateSettings(request)
                )
        );
    }

    @PostMapping("/reset")
    public ResponseEntity<ApiResponse<SystemSettingResponseDTO>>
    resetSettings() {
        return ResponseEntity.ok(
                ApiResponse.success(
                        "Khôi phục cấu hình thành công",
                        service.resetSettings()
                )
        );
    }
}