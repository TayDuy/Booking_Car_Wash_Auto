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

@RestController
@RequestMapping("/api/v1/branches")
@RequiredArgsConstructor
public class BranchController {

    private final BranchService branchService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<BranchResponseDTO>>> getAll(
            @RequestParam(required = false, name = "status") BranchStatus status) {
        return ResponseEntity.ok(ApiResponse.success(branchService.findAll(status)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<BranchResponseDTO>> getById(@PathVariable("id") Integer id) {
        return ResponseEntity.ok(ApiResponse.success(branchService.findById(id)));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<ApiResponse<BranchResponseDTO>> create(
            @Valid @RequestBody BranchRequestDTO request) {
        BranchResponseDTO created = branchService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(created));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<BranchResponseDTO>> update(
            @PathVariable("id") Integer id,
            @Valid @RequestBody BranchRequestDTO request) {
        return ResponseEntity.ok(ApiResponse.success(branchService.update(id, request)));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<BranchResponseDTO>> changeStatus(
            @PathVariable("id") Integer id,
            @RequestParam(name = "status") BranchStatus status) {
        return ResponseEntity.ok(ApiResponse.success(branchService.changeStatus(id, status)));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> softDelete(@PathVariable("id") Integer id) {
        branchService.softDelete(id);
        return ResponseEntity.noContent().build();
    }
}