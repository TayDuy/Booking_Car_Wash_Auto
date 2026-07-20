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

@RestController
@RequestMapping("/api/v1/service-packages")
@RequiredArgsConstructor
public class ServicePackageController {

    private final ServicePackageService service;

    @GetMapping("/active")
    public ResponseEntity<ApiResponse<List<ServicePackageResponseDTO>>> getAllActive() {
        return ResponseEntity.ok(ApiResponse.success(service.getAllActive()));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ServicePackageResponseDTO>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(service.getAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ServicePackageResponseDTO>> getById(@PathVariable("id") Integer id) {
        return ResponseEntity.ok(ApiResponse.success(service.getById(id)));
    }

    @GetMapping("/{id}/detail")
    public ResponseEntity<ApiResponse<ServicePackageDetailResponseDTO>> getDetail(@PathVariable("id") Integer id) {
        return ResponseEntity.ok(ApiResponse.success(service.getDetailById(id)));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<ApiResponse<ServicePackageResponseDTO>> create(
            @Valid @RequestBody ServicePackageRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(service.create(request)));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ServicePackageResponseDTO>> update(
            @PathVariable("id") Integer id,
            @Valid @RequestBody ServicePackageRequestDTO request) {
        return ResponseEntity.ok(ApiResponse.success(service.update(id, request)));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deactivate(@PathVariable("id") Integer id) {
        service.deactivate(id);
        return ResponseEntity.noContent().build();
    }
}