package com.autowash.backend.reward.controller;

import com.autowash.backend.reward.dto.RewardRequestDTO;
import com.autowash.backend.reward.dto.RewardResponseDTO;
import com.autowash.backend.reward.service.RewardService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller xử lý các request liên quan đến Reward (FR-7).
 *
 * <p>Base path: {@code /api/v1/rewards}</p>
 *
 * <p>Controller chỉ chịu trách nhiệm:
 * <ul>
 *   <li>Nhận request, trả response HTTP</li>
 *   <li>Delegate toàn bộ logic xuống {@link RewardService}</li>
 * </ul>
 * Không chứa business logic.</p>
 */
@RestController
@RequestMapping("/api/v1/rewards")
@RequiredArgsConstructor
public class RewardController {

    private final RewardService rewardService;

    // ── CREATE ────────────────────────────────────────────────────────────────

    /**
     * Tạo mới một reward — CHỈ ADMIN.
     *
     * <p>{@code POST /api/v1/rewards}</p>
     *
     * <p>{@code @Valid} kích hoạt Bean Validation trên {@link RewardRequestDTO}
     * — nếu vi phạm constraint, Spring tự động trả về HTTP 400 trước khi
     * vào service.</p>
     *
     * <p>@PreAuthorize: Chặn ngay tại đây nếu không phải ADMIN → 403 Forbidden.</p>
     *
     * @param dto thông tin reward từ request body (JSON)
     * @return HTTP 201 Created kèm reward vừa tạo
     */
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<RewardResponseDTO> create(@Valid @RequestBody RewardRequestDTO dto) {
        RewardResponseDTO response = rewardService.create(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // ── READ ──────────────────────────────────────────────────────────────────

    /**
     * Lấy danh sách toàn bộ reward.
     *
     * <p>{@code GET /api/v1/rewards}</p>
     *
     * @return HTTP 200 kèm danh sách reward (rỗng nếu chưa có dữ liệu)
     */
    @GetMapping
    public ResponseEntity<List<RewardResponseDTO>> getAll() {
        return ResponseEntity.ok(rewardService.getAll());
    }

    /**
     * Lấy thông tin chi tiết một reward theo ID.
     *
     * <p>{@code GET /api/v1/rewards/{id}}</p>
     *
     * @param id primary key của reward
     * @return HTTP 200 kèm thông tin reward,
     *         hoặc HTTP 404 nếu không tìm thấy (do GlobalExceptionHandler xử lý)
     */
    @GetMapping("/{id}")
    public ResponseEntity<RewardResponseDTO> getById(@PathVariable Integer id) {
        return ResponseEntity.ok(rewardService.getById(id));
    }

    // ── UPDATE ────────────────────────────────────────────────────────────────

    /**
     * Cập nhật thông tin reward — CHỈ ADMIN.
     *
     * <p>{@code PUT /api/v1/rewards/{id}}</p>
     *
     * <p>@PreAuthorize: Chặn ngay tại đây nếu không phải ADMIN → 403 Forbidden.</p>
     *
     * @param id  primary key của reward cần cập nhật
     * @param dto dữ liệu mới từ request body (field null = giữ nguyên giá trị cũ)
     * @return HTTP 200 kèm reward sau khi cập nhật,
     *         hoặc HTTP 404 nếu không tìm thấy
     */
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<RewardResponseDTO> update(
            @PathVariable Integer id,
            @Valid @RequestBody RewardRequestDTO dto) {
        return ResponseEntity.ok(rewardService.update(id, dto));
    }

    // ── DELETE (soft) ─────────────────────────────────────────────────────────

    /**
     * Vô hiệu hóa reward (soft-delete) — CHỈ ADMIN.
     * Đặt status = inactive, không xóa khỏi DB để giữ lịch sử redemption.
     *
     * <p>{@code DELETE /api/v1/rewards/{id}}</p>
     *
     * <p>@PreAuthorize: Chặn ngay tại đây nếu không phải ADMIN → 403 Forbidden.</p>
     *
     * @param id primary key của reward cần vô hiệu hóa
     * @return HTTP 204 No Content nếu thành công,
     *         hoặc HTTP 404 nếu không tìm thấy
     */
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deactivate(@PathVariable Integer id) {
        rewardService.deactivate(id);
        return ResponseEntity.noContent().build();
    }
}