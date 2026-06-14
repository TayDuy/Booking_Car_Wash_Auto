package com.autowash.backend.vehicle.controller;

import com.autowash.backend.vehicle.dto.VehicleRequest;
import com.autowash.backend.vehicle.dto.VehicleResponse;
import com.autowash.backend.vehicle.service.VehicleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/vehicles")
@RequiredArgsConstructor
public class VehicleController {

    private final VehicleService vehicleService;

    // Lấy danh sách xe của chính mình
    @GetMapping
    public ResponseEntity<List<VehicleResponse>> getMyVehicles(
            @org.springframework.security.core.annotation.AuthenticationPrincipal com.autowash.backend.security.CustomUserDetails userDetails) {
        return ResponseEntity.ok(vehicleService.getMyVehicles(userDetails.getId()));
    }

    // Thêm xe mới
    @PostMapping
    public ResponseEntity<VehicleResponse> addVehicle(
            @org.springframework.security.core.annotation.AuthenticationPrincipal com.autowash.backend.security.CustomUserDetails userDetails,
            @Valid @RequestBody VehicleRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(vehicleService.addVehicle(userDetails.getId(), request));
    }

    // Sửa thông tin xe
    @PutMapping("/{vehicleId}")
    public ResponseEntity<VehicleResponse> updateVehicle(
            @org.springframework.security.core.annotation.AuthenticationPrincipal com.autowash.backend.security.CustomUserDetails userDetails,
            @PathVariable Integer vehicleId,
            @Valid @RequestBody VehicleRequest request) {
        return ResponseEntity.ok(vehicleService.updateVehicle(userDetails.getId(), vehicleId, request));
    }

    // Xóa xe (Soft delete)
    @DeleteMapping("/{vehicleId}")
    public ResponseEntity<Void> deleteVehicle(
            @org.springframework.security.core.annotation.AuthenticationPrincipal com.autowash.backend.security.CustomUserDetails userDetails,
            @PathVariable Integer vehicleId) {
        vehicleService.deleteVehicle(userDetails.getId(), vehicleId);
        return ResponseEntity.noContent().build();
    }
}