package com.autowash.backend.servicepackage.controller;

import com.autowash.backend.common.dto.ApiResponse;
import com.autowash.backend.servicepackage.dto.ServicePackageDetailResponseDTO;
import com.autowash.backend.servicepackage.dto.ServicePackageRequestDTO;
import com.autowash.backend.servicepackage.dto.ServicePackageResponseDTO;
import com.autowash.backend.servicepackage.service.ServicePackageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller cho Service Package.
 * Base path: /api/v1/service-packages
 */
@RestController
@RequestMapping("/api/v1/service-packages")
@RequiredArgsConstructor
public class ServicePackageController {

    private final ServicePackageService service;

    /**
     * GET /api/v1/service-packages/active
     * Dành cho khách hàng: chỉ lấy dịch vụ đang hoạt động.
     */
    @GetMapping("/active")
    public ResponseEntity<ApiResponse<List<ServicePackageResponseDTO>>> getAllActive() {
        return ResponseEntity.ok(ApiResponse.success(service.getAllActive()));
    }

    /**
     * GET /api/v1/service-packages
     * Lấy toàn bộ kể cả inactive (admin quản lý).
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<ServicePackageResponseDTO>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(service.getAll()));
    }

    /**
     * GET /api/v1/service-packages/{id}
     * Lấy chi tiết 1 dịch vụ theo ID.
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ServicePackageResponseDTO>> getById(@PathVariable Integer id) {
        return ResponseEntity.ok(ApiResponse.success(service.getById(id)));
    }

    /**
     * GET /api/v1/service-packages/{id}/detail
     * Lấy chi tiết dịch vụ kèm bảng giá theo loại xe.
     */
    @GetMapping("/{id}/detail")
    public ResponseEntity<ApiResponse<ServicePackageDetailResponseDTO>> getDetail(@PathVariable Integer id) {
        return ResponseEntity.ok(ApiResponse.success(service.getDetailById(id)));
    }

    /**
     * POST /api/v1/service-packages
     * Tạo mới dịch vụ.
     */
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<ApiResponse<ServicePackageResponseDTO>> create(
            @Valid @RequestBody ServicePackageRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(service.create(request)));
    }

    /**
     * PUT /api/v1/service-packages/{id}
     * Cập nhật dịch vụ.
     */
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ServicePackageResponseDTO>> update(
            @PathVariable Integer id,
            @Valid @RequestBody ServicePackageRequestDTO request) {
        return ResponseEntity.ok(ApiResponse.success(service.update(id, request)));
    }

    /**
     * DELETE /api/v1/service-packages/{id}
     * Xóa mềm: set isActive = false, không xóa khỏi DB.
     */
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deactivate(@PathVariable Integer id) {
        service.deactivate(id);
        return ResponseEntity.noContent().build();
    }
}
