package com.autowash.backend.washbay.controller;

import com.autowash.backend.common.dto.ApiResponse;
import com.autowash.backend.washbay.dto.WashBayRequestDTO;
import com.autowash.backend.washbay.dto.WashBayResponseDTO;
import com.autowash.backend.washbay.entity.WashBay.BayStatus;
import com.autowash.backend.washbay.service.WashBayService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/wash-bays")
@RequiredArgsConstructor
public class WashBayController {

    private final WashBayService washBayService;

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<ApiResponse<WashBayResponseDTO>> create(
            @Valid @RequestBody WashBayRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(washBayService.create(dto)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<WashBayResponseDTO>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(washBayService.getAll()));
    }

    @GetMapping("/{bayId}")
    public ResponseEntity<ApiResponse<WashBayResponseDTO>> getById(
            @PathVariable("bayId") Integer bayId) {
        return ResponseEntity.ok(ApiResponse.success(washBayService.getById(bayId)));
    }

    @GetMapping("/branch/{branchId}")
    public ResponseEntity<ApiResponse<List<WashBayResponseDTO>>> getByBranch(
            @PathVariable("branchId") Integer branchId) {
        return ResponseEntity.ok(ApiResponse.success(washBayService.getByBranch(branchId)));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{bayId}")
    public ResponseEntity<ApiResponse<WashBayResponseDTO>> update(
            @PathVariable("bayId") Integer bayId,
            @Valid @RequestBody WashBayRequestDTO dto) {
        return ResponseEntity.ok(ApiResponse.success(washBayService.update(bayId, dto)));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/{bayId}/status")
    public ResponseEntity<ApiResponse<WashBayResponseDTO>> updateStatus(
            @PathVariable("bayId") Integer bayId,
            @RequestParam(name = "value") BayStatus value) {
        return ResponseEntity.ok(ApiResponse.success(washBayService.updateStatus(bayId, value)));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{bayId}")
    public ResponseEntity<Void> delete(@PathVariable("bayId") Integer bayId) {
        washBayService.delete(bayId);
        return ResponseEntity.noContent().build();
    }
}