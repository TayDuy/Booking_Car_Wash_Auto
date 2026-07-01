package com.autowash.backend.branch.controller;

import com.autowash.backend.common.dto.ApiResponse;
import com.autowash.backend.branch.dto.BranchRequestDTO;
import com.autowash.backend.branch.dto.BranchResponseDTO;
import com.autowash.backend.branch.entity.Branch.BranchStatus;
import com.autowash.backend.branch.service.BranchService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller xử lý các HTTP request liên quan đến Chi nhánh (Branch).
 */
@RestController
@RequestMapping("/api/v1/branches")
@RequiredArgsConstructor
public class BranchController {

    private final BranchService branchService;

    /**
     * Lấy danh sách chi nhánh.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<BranchResponseDTO>>> getAll(
            @RequestParam(required = false) BranchStatus status) {
        return ResponseEntity.ok(ApiResponse.success(branchService.findAll(status)));
    }

    /**
     * Lấy chi tiết một chi nhánh theo ID.
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<BranchResponseDTO>> getById(@PathVariable Integer id) {
        return ResponseEntity.ok(ApiResponse.success(branchService.findById(id)));
    }

    /**
     * Tạo chi nhánh mới.
     */
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<ApiResponse<BranchResponseDTO>> create(
            @Valid @RequestBody BranchRequestDTO request) {
        BranchResponseDTO created = branchService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(created));
    }

    /**
     * Cập nhật thông tin chi nhánh.
     */
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<BranchResponseDTO>> update(
            @PathVariable Integer id,
            @Valid @RequestBody BranchRequestDTO request) {
        return ResponseEntity.ok(ApiResponse.success(branchService.update(id, request)));
    }

    /**
     * Thay đổi trạng thái hoạt động của chi nhánh.
     */
    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<BranchResponseDTO>> changeStatus(
            @PathVariable Integer id,
            @RequestParam BranchStatus status) {
        return ResponseEntity.ok(ApiResponse.success(branchService.changeStatus(id, status)));
    }

    /**
     * Soft delete chi nhánh.
     */
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> softDelete(@PathVariable Integer id) {
        branchService.softDelete(id);
        return ResponseEntity.noContent().build();
    }
}
