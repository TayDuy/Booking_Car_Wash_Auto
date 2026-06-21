package com.autowash.backend.servicepackage.controller;

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
 *
 * Phân quyền (FR-13):
 *  - GET        → Tất cả (khách hàng xem để chọn gói)
 *  - POST/PUT/DELETE → Chỉ ADMIN
 */
@RestController
@RequestMapping("/api/v1/service-packages")
@RequiredArgsConstructor
public class ServicePackageController {

    private final ServicePackageService service;

    /**
     * GET /api/v1/service-packages/active
     * Dành cho khách hàng: chỉ lấy dịch vụ đang hoạt động.
     * Không cần @PreAuthorize vì khách hàng cần xem để chọn gói dịch vụ.
     */
    @GetMapping("/active")
    public ResponseEntity<List<ServicePackageResponseDTO>> getAllActive() {
        return ResponseEntity.ok(service.getAllActive());
    }

    /**
     * GET /api/v1/service-packages
     * Lấy toàn bộ kể cả inactive (admin quản lý).
     * Không cần @PreAuthorize - chỉ đọc dữ liệu.
     */
    @GetMapping
    public ResponseEntity<List<ServicePackageResponseDTO>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    /**
     * GET /api/v1/service-packages/{id}
     * Lấy chi tiết 1 dịch vụ theo ID.
     * Không cần @PreAuthorize - chỉ đọc dữ liệu.
     */
    @GetMapping("/{id}")
    public ResponseEntity<ServicePackageResponseDTO> getById(@PathVariable Integer id) {
        return ResponseEntity.ok(service.getById(id));
    }

    /**
     * POST /api/v1/service-packages
     * Tạo mới dịch vụ.
     * @PreAuthorize: Chặn ngay nếu không phải Admin → 403 Forbidden
     */
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<ServicePackageResponseDTO> create(
            @Valid @RequestBody ServicePackageRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request));
    }

    /**
     * PUT /api/v1/service-packages/{id}
     * Cập nhật dịch vụ — hỗ trợ partial update (field null sẽ bị bỏ qua).
     * @PreAuthorize: Chặn ngay nếu không phải Admin → 403 Forbidden
     */
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<ServicePackageResponseDTO> update(
            @PathVariable Integer id,
            @Valid @RequestBody ServicePackageRequestDTO request) {
        return ResponseEntity.ok(service.update(id, request));
    }

    /**
     * DELETE /api/v1/service-packages/{id}
     * Xóa mềm: set isActive = false, không xóa khỏi DB.
     * @PreAuthorize: Chặn ngay nếu không phải Admin → 403 Forbidden
     * Trả 204 No Content theo chuẩn REST.
     */
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deactivate(@PathVariable Integer id) {
        service.deactivate(id);
        return ResponseEntity.noContent().build();
    }
<<<<<<< HEAD
}
=======
}
>>>>>>> origin/develop
