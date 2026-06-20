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
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller quản lý WashBay — các bay rửa xe trong chi nhánh.
 *
 * <p>Base path: {@code /api/wash-bays}</p>
 *
 * <p>Tất cả response đều wrap trong {@link ApiResponse} để
 * đồng bộ format với {@code GlobalExceptionHandler}.</p>
 */
@RestController
@RequestMapping("/api/wash-bays")
@RequiredArgsConstructor
public class WashBayController {

    private final WashBayService washBayService;

    /**
     * Tạo mới một wash bay.
     *
     * <p>{@code POST /api/wash-bays}</p>
     * <p>Trả HTTP 201 Created kèm thông tin bay vừa tạo.</p>
     */
    @PostMapping
    public ResponseEntity<ApiResponse<WashBayResponseDTO>> create(
            @Valid @RequestBody WashBayRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(washBayService.create(dto)));
    }

    /**
     * Lấy toàn bộ danh sách bay trong hệ thống.
     *
     * <p>{@code GET /api/wash-bays}</p>
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<WashBayResponseDTO>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(washBayService.getAll()));
    }

    /**
     * Lấy thông tin một bay theo ID.
     *
     * <p>{@code GET /api/wash-bays/{bayId}}</p>
     * <p>Trả HTTP 404 nếu bay không tồn tại.</p>
     */
    @GetMapping("/{bayId}")
    public ResponseEntity<ApiResponse<WashBayResponseDTO>> getById(
            @PathVariable Integer bayId) {
        return ResponseEntity.ok(ApiResponse.success(washBayService.getById(bayId)));
    }

    /**
     * Lấy danh sách bay theo chi nhánh.
     *
     * <p>{@code GET /api/wash-bays/branch/{branchId}}</p>
     * <p>Trả HTTP 404 nếu chi nhánh không tồn tại.</p>
     */
    @GetMapping("/branch/{branchId}")
    public ResponseEntity<ApiResponse<List<WashBayResponseDTO>>> getByBranch(
            @PathVariable Integer branchId) {
        return ResponseEntity.ok(ApiResponse.success(washBayService.getByBranch(branchId)));
    }

    /**
     * Cập nhật toàn bộ thông tin bay.
     *
     * <p>{@code PUT /api/wash-bays/{bayId}}</p>
     * <p>Chỉ field không null trong body mới được cập nhật (partial update).</p>
     */
    @PutMapping("/{bayId}")
    public ResponseEntity<ApiResponse<WashBayResponseDTO>> update(
            @PathVariable Integer bayId,
            @Valid @RequestBody WashBayRequestDTO dto) {
        return ResponseEntity.ok(ApiResponse.success(washBayService.update(bayId, dto)));
    }

    /**
     * Chỉ cập nhật trạng thái vật lý của bay.
     *
     * <p>{@code PATCH /api/wash-bays/{bayId}/status?value=maintenance}</p>
     * <p>Dùng PATCH thay PUT để tránh ghi đè toàn bộ object
     * chỉ vì muốn đổi 1 field status.</p>
     */
    @PatchMapping("/{bayId}/status")
    public ResponseEntity<ApiResponse<WashBayResponseDTO>> updateStatus(
            @PathVariable Integer bayId,
            @RequestParam BayStatus value) {
        return ResponseEntity.ok(ApiResponse.success(washBayService.updateStatus(bayId, value)));
    }

    /**
     * Xóa bay khỏi hệ thống.
     *
     * <p>{@code DELETE /api/wash-bays/{bayId}}</p>
     * <p>Trả HTTP 204 No Content khi xóa thành công.</p>
     */
    @DeleteMapping("/{bayId}")
    public ResponseEntity<Void> delete(@PathVariable Integer bayId) {
        washBayService.delete(bayId);
        return ResponseEntity.noContent().build();
    }
}