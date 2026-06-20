package com.autowash.backend.servicepackage.controller;

<<<<<<< HEAD
import com.autowash.backend.servicepackage.dto.ServicePackageRequestDTO;
import com.autowash.backend.servicepackage.dto.ServicePackageResponseDTO;
=======
import com.autowash.backend.servicepackage.dto.ServicePackageRequest;
import com.autowash.backend.servicepackage.dto.ServicePackageResponse;
import com.autowash.backend.servicepackage.entity.ServicePackage;
>>>>>>> origin/dev/Dung
import com.autowash.backend.servicepackage.service.ServicePackageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

<<<<<<< HEAD
/**
 * REST controller cho Service Package.
 * Base path: /api/v1/service-packages
 *
 * Phân quyền (gợi ý cho Spring Security):
 *  - GET  → PUBLIC (hoặc ROLE_USER)
 *  - POST/PUT/DELETE → ROLE_ADMIN
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
    public ResponseEntity<List<ServicePackageResponseDTO>> getAllActive() {
        return ResponseEntity.ok(service.getAllActive());
    }

    /**
     * GET /api/v1/service-packages
     * Dành cho admin: lấy toàn bộ kể cả inactive.
     */
    @GetMapping
    public ResponseEntity<List<ServicePackageResponseDTO>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    /**
     * GET /api/v1/service-packages/{id}
     * Lấy chi tiết 1 dịch vụ.
     */
    @GetMapping("/{id}")
    public ResponseEntity<ServicePackageResponseDTO> getById(@PathVariable Integer id) {
        return ResponseEntity.ok(service.getById(id));
    }

    /**
     * POST /api/v1/service-packages
     * Tạo mới dịch vụ. @Valid kích hoạt Bean Validation trên RequestDTO.
     */
    @PostMapping
    public ResponseEntity<ServicePackageResponseDTO> create(
            @Valid @RequestBody ServicePackageRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request));
    }

    /**
     * PUT /api/v1/service-packages/{id}
     * Cập nhật dịch vụ — hỗ trợ partial update (field null sẽ bị bỏ qua).
     */
    @PutMapping("/{id}")
    public ResponseEntity<ServicePackageResponseDTO> update(
            @PathVariable Integer id,
            @Valid @RequestBody ServicePackageRequestDTO request) {
        return ResponseEntity.ok(service.update(id, request));
    }

    /**
     * DELETE /api/v1/service-packages/{id}
     * Xóa mềm: set isActive = false, không xóa khỏi DB.
     * Trả 204 No Content theo chuẩn REST.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deactivate(@PathVariable Integer id) {
        service.deactivate(id);
        return ResponseEntity.noContent().build();
    }
}
=======
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class ServicePackageController {

    //Nhúng Service vào Controller
    private final ServicePackageService servicePackageService;
    @PostMapping("/admin/service-packages")
    public ResponseEntity<ServicePackageResponse> createServicePackage(@Valid@RequestBody ServicePackageRequest request){
        return new ResponseEntity<>(servicePackageService.createServicePackage(request), HttpStatus.CREATED);
    }

    @GetMapping("/service-packages")
    public ResponseEntity<List<ServicePackageResponse>> getAllServicePackages(){
        return ResponseEntity.ok(servicePackageService.getAllServicePackages());
    }

    @GetMapping("/service-packages/{id}")
    public ResponseEntity<ServicePackageResponse> getServicePackageById(@PathVariable("id") Integer id){
        return ResponseEntity.ok(servicePackageService.getServicePackageById(id));
    }

    @PutMapping("/admin/service-packages/{id}")
    public ResponseEntity<ServicePackageResponse> updateServicePackage(@PathVariable("id") Integer id, @Valid@RequestBody ServicePackageRequest request){
        return ResponseEntity.ok(servicePackageService.updateServicePackage(id,request));
    }

}
>>>>>>> origin/dev/Dung
