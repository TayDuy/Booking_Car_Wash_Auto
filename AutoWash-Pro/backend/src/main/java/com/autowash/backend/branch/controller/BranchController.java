package com.autowash.backend.branch.controller;

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
 *
 * <p>Base URL: {@code /api/v1/branches}</p>
 *
 * <h3>Danh sách endpoints:</h3>
 * <pre>
 * GET    /api/v1/branches                  Lấy danh sách chi nhánh (filter theo ?status=)
 * GET    /api/v1/branches/{id}             Lấy chi tiết một chi nhánh
 * POST   /api/v1/branches                  Tạo chi nhánh mới (Admin only)
 * PUT    /api/v1/branches/{id}             Cập nhật thông tin chi nhánh (Admin only)
 * PATCH  /api/v1/branches/{id}/status      Đổi trạng thái chi nhánh (Admin only)
 * DELETE /api/v1/branches/{id}             Soft delete - chuyển sang CLOSED (Admin only)
 * </pre>
 */
@RestController
@RequestMapping("/api/v1/branches")
@RequiredArgsConstructor
public class BranchController {

    private final BranchService branchService;

    // ====================================================================
    //  GET /api/v1/branches?status=open  — Ai cũng xem được
    // ====================================================================

    /**
     * Lấy danh sách chi nhánh (khách hàng cần xem để chọn chỗ đặt lịch).
     * @param status (optional) lọc theo trạng thái; null = lấy tất cả
     * @return 200 OK + danh sách DTO
     */
    @GetMapping
    public ResponseEntity<List<BranchResponseDTO>> getAll(
            @RequestParam(required = false) BranchStatus status) {
        return ResponseEntity.ok(branchService.findAll(status));
    }

    // ====================================================================
    //  GET /api/v1/branches/{id}  — Ai cũng xem được
    // ====================================================================

    /**
     * Lấy chi tiết một chi nhánh theo ID.
     * @param id ID của chi nhánh cần tra cứu
     * @return 200 OK + DTO chi tiết | 404 Not Found
     */
    @GetMapping("/{id}")
    public ResponseEntity<BranchResponseDTO> getById(@PathVariable Integer id) {
        return ResponseEntity.ok(branchService.findById(id));
    }

    // ====================================================================
    //  POST /api/v1/branches  — Chỉ Admin
    // ====================================================================

    /**
     * Tạo chi nhánh mới.
     * @PreAuthorize: Chặn ngay tại đây nếu token không phải Admin → 403 Forbidden
     * @return 201 Created + DTO chi nhánh vừa tạo | 400 Bad Request | 409 Conflict
     */
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<BranchResponseDTO> create(
            @Valid @RequestBody BranchRequestDTO request) {
        BranchResponseDTO created = branchService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    // ====================================================================
    //  PUT /api/v1/branches/{id}  — Chỉ Admin
    // ====================================================================

    /**
     * Cập nhật thông tin chi nhánh.
     * @PreAuthorize: Chặn ngay tại đây nếu token không phải Admin → 403 Forbidden
     * @return 200 OK + DTO sau khi cập nhật | 404 Not Found
     */
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<BranchResponseDTO> update(
            @PathVariable Integer id,
            @Valid @RequestBody BranchRequestDTO request) {
        return ResponseEntity.ok(branchService.update(id, request));
    }

    // ====================================================================
    //  PATCH /api/v1/branches/{id}/status  — Chỉ Admin
    // ====================================================================

    /**
     * Thay đổi trạng thái hoạt động của chi nhánh.
     * @PreAuthorize: Chặn ngay tại đây nếu token không phải Admin → 403 Forbidden
     * Ví dụ: PATCH /api/v1/branches/3/status?status=maintenance
     * @return 200 OK + DTO sau khi đổi trạng thái | 404 Not Found
     */
    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/{id}/status")
    public ResponseEntity<BranchResponseDTO> changeStatus(
            @PathVariable Integer id,
            @RequestParam BranchStatus status) {
        return ResponseEntity.ok(branchService.changeStatus(id, status));
    }

    // ====================================================================
    //  DELETE /api/v1/branches/{id}  — Chỉ Admin
    // ====================================================================

    /**
     * Soft delete chi nhánh (chuyển status về CLOSED, không xóa khỏi DB).
     * @PreAuthorize: Chặn ngay tại đây nếu token không phải Admin → 403 Forbidden
     * @return 204 No Content khi thành công | 404 Not Found
     */
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> softDelete(@PathVariable Integer id) {
        branchService.softDelete(id);
        return ResponseEntity.noContent().build();
    }
<<<<<<< HEAD
}
=======
}
>>>>>>> origin/develop
