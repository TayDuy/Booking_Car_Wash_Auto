package com.autowash.backend.vehicle.controller;

import com.autowash.backend.vehicle.dto.VehicleRequest;
import com.autowash.backend.vehicle.dto.VehicleResponse;
import com.autowash.backend.vehicle.service.VehicleService;
import com.autowash.backend.common.exception.BusinessException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.annotation.PostConstruct;

import java.util.List;

@RestController
@RequestMapping("/api/v1/vehicles")
@RequiredArgsConstructor
public class VehicleController {

    private final VehicleService vehicleService;

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<VehicleResponse>> getAllVehiclesForAdmin() {
        return ResponseEntity.ok(vehicleService.getAllVehicles());
    }

    // Lấy danh sách xe của chính mình
    @GetMapping
    public ResponseEntity<List<VehicleResponse>> getMyVehicles(
            @org.springframework.security.core.annotation.AuthenticationPrincipal com.autowash.backend.security.CustomUserDetails userDetails) {
        return ResponseEntity.ok(vehicleService.getMyVehicles(getUserId(userDetails)));
    }

    // Thêm xe mới
    @PostMapping
    public ResponseEntity<VehicleResponse> addVehicle(
            @org.springframework.security.core.annotation.AuthenticationPrincipal com.autowash.backend.security.CustomUserDetails userDetails,
            @Valid @RequestBody VehicleRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(vehicleService.addVehicle(getUserId(userDetails), request));
    }

    // Sửa thông tin xe
    @PutMapping("/{vehicleId}")
    public ResponseEntity<VehicleResponse> updateVehicle(
            @org.springframework.security.core.annotation.AuthenticationPrincipal com.autowash.backend.security.CustomUserDetails userDetails,
            @PathVariable Integer vehicleId,
            @Valid @RequestBody VehicleRequest request) {
        return ResponseEntity.ok(vehicleService.updateVehicle(getUserId(userDetails), vehicleId, request));
    }

    // Xóa xe (Soft delete)
    @DeleteMapping("/{vehicleId}")
    public ResponseEntity<Void> deleteVehicle(
            @org.springframework.security.core.annotation.AuthenticationPrincipal com.autowash.backend.security.CustomUserDetails userDetails,
            @PathVariable Integer vehicleId) {
        vehicleService.deleteVehicle(getUserId(userDetails), vehicleId);
        return ResponseEntity.noContent().build();
    }

    // Bật tắt trạng thái hoạt động của xe
    @PutMapping("/{vehicleId}/toggle-active")
    public ResponseEntity<VehicleResponse> toggleActive(
            @org.springframework.security.core.annotation.AuthenticationPrincipal com.autowash.backend.security.CustomUserDetails userDetails,
            @PathVariable Integer vehicleId) {
        return ResponseEntity.ok(vehicleService.toggleActive(getUserId(userDetails), vehicleId));
    }

    @PostConstruct
    public void init() {
        System.out.println("===== VehicleController loaded =====");
    }

    private Integer getUserId(com.autowash.backend.security.CustomUserDetails userDetails) {
        if (userDetails == null) {
            throw new BusinessException(
                    "Chưa đăng nhập hoặc phiên làm việc đã hết hạn",
                    HttpStatus.UNAUTHORIZED
            );
        }
        return userDetails.getId();
    }
}