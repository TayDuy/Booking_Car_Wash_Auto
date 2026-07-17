package com.autowash.backend.promotion.controller;

import com.autowash.backend.promotion.dto.PromotionApplyRequestDTO;
import com.autowash.backend.promotion.dto.PromotionApplyResponseDTO;
import com.autowash.backend.promotion.dto.PromotionRequestDTO;
import com.autowash.backend.promotion.dto.PromotionResponseDTO;
import com.autowash.backend.promotion.entity.Promotion;
import com.autowash.backend.promotion.service.PromotionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

/**
 * REST Controller xử lý các request liên quan đến Promotion (khuyến mãi).
 *
 * <p>Base path: {@code /api/v1/promotions}</p>
 *
 * <p>Phân quyền:
 * <ul>
 *   <li>POST / PUT / DELETE → chỉ ADMIN</li>
 *   <li>GET                 → public hoặc USER trở lên</li>
 * </ul>
 * </p>
 */
@RestController
@RequestMapping("/api/v1/promotions")
@RequiredArgsConstructor
public class PromotionController {

    private final PromotionService promotionService;

    // ── CREATE ────────────────────────────────────────────────────────────────

    /**
     * Tạo mới một promotion — CHỈ ADMIN.
     * createdByUserId lấy từ JWT trong SecurityContext —
     * client không thể tự truyền lên để giả mạo.
     *
     * <p>{@code POST /api/v1/promotions}</p>
     *
     * <p>@PreAuthorize: Chặn ngay tại đây nếu không phải ADMIN → 403 Forbidden.</p>
     *
     * @param dto         thông tin promotion từ request body (JSON)
     * @param currentUser user đang đăng nhập, inject từ Spring Security
     * @return HTTP 201 Created kèm promotion vừa tạo
     */
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<PromotionResponseDTO> create(
            @Valid @RequestBody PromotionRequestDTO dto,
            @AuthenticationPrincipal UserDetails currentUser) {

        // username trong UserDetails là email (xem JwtAuthenticationFilter)
        // Service sẽ tự resolve email → userId
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(promotionService.create(dto, currentUser.getUsername()));
    }

    // ── READ ──────────────────────────────────────────────────────────────────

    /**
     * Lấy danh sách toàn bộ promotion với filter tùy chọn.
     * Tất cả query param đều optional — không truyền = lấy tất cả.
     *
     * <p>{@code GET /api/v1/promotions}</p>
     *
     * @param status       lọc theo trạng thái: {@code active / inactive / expired}
     * @param vehicleType  lọc theo loại xe: {@code sedan / suv / truck / minivan}
     * @param discountType lọc theo loại giảm: {@code percent / fixed / free_service}
     * @param date         lọc promotion còn hiệu lực tại ngày này (yyyy-MM-dd)
     * @return HTTP 200 kèm danh sách promotion
     */
    @GetMapping
    public ResponseEntity<List<PromotionResponseDTO>> getAll(
            @RequestParam(required = false) Promotion.PromotionStatus status,
            @RequestParam(required = false) Promotion.VehicleType vehicleType,
            @RequestParam(required = false) Promotion.DiscountType discountType,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(
                promotionService.getAll(status, vehicleType, discountType, date));
    }

    /**
     * Lấy thông tin chi tiết một promotion theo ID.
     *
     * <p>{@code GET /api/v1/promotions/{id}}</p>
     *
     * @param id primary key của promotion
     * @return HTTP 200 kèm thông tin promotion, hoặc HTTP 404 nếu không tìm thấy
     */
    @GetMapping("/{id}")
    public ResponseEntity<PromotionResponseDTO> getById(@PathVariable Integer id) {
        return ResponseEntity.ok(promotionService.getById(id));
    }

    /**
     * Lấy danh sách promotion đang active — dùng cho client chọn khuyến mãi.
     *
     * <p>{@code GET /api/v1/promotions/active}</p>
     *
     * @return HTTP 200 kèm danh sách promotion active
     */
    @GetMapping("/active")
    public ResponseEntity<List<PromotionResponseDTO>> getAllActive() {
        return ResponseEntity.ok(promotionService.getAllActive());
    }

    // ── APPLY ─────────────────────────────────────────────────────────────────

    /**
     * Kiểm tra và tính số tiền giảm khi áp dụng promotion vào đơn hàng.
     * Dùng khi khách chọn promotion trước khi confirm booking.
     *
     * <p>{@code POST /api/v1/promotions/apply}</p>
     *
     * @param req thông tin đơn hàng và promotion muốn áp dụng
     * @return HTTP 200 kèm kết quả: applicable, discountAmount, finalAmount
     */
    @PreAuthorize("hasRole('CUSTOMER')")
    @PostMapping("/apply")
    public ResponseEntity<PromotionApplyResponseDTO> applyPromotion(
            @Valid @RequestBody PromotionApplyRequestDTO req) {
        return ResponseEntity.ok(promotionService.applyPromotion(req));
    }

    // ── UPDATE ────────────────────────────────────────────────────────────────

    /**
     * Cập nhật thông tin promotion (patch — chỉ field được gửi lên mới thay đổi) — CHỈ ADMIN.
     *
     * <p>{@code PUT /api/v1/promotions/{id}}</p>
     *
     * <p>@PreAuthorize: Chặn ngay tại đây nếu không phải ADMIN → 403 Forbidden.</p>
     *
     * @param id  primary key của promotion cần cập nhật
     * @param dto dữ liệu mới từ request body
     * @return HTTP 200 kèm promotion sau khi cập nhật, hoặc HTTP 404
     */
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<PromotionResponseDTO> update(
            @PathVariable Integer id,
            @Valid @RequestBody PromotionRequestDTO dto) {
        return ResponseEntity.ok(promotionService.update(id, dto));
    }

    // ── DELETE (soft) ─────────────────────────────────────────────────────────

    /**
     * Vô hiệu hóa promotion (soft-delete) — CHỈ ADMIN.
     * Đặt {@code status = inactive}, không xóa khỏi DB để giữ lịch sử promotion đã áp dụng vào các booking.
     *
     * <p>{@code DELETE /api/v1/promotions/{id}}</p>
     *
     * <p>@PreAuthorize: Chặn ngay tại đây nếu không phải ADMIN → 403 Forbidden.</p>
     *
     * @param id primary key của promotion cần vô hiệu hóa
     * @return HTTP 204 No Content nếu thành công, hoặc HTTP 404
     */
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deactivate(@PathVariable Integer id) {
        promotionService.deactivate(id);
        return ResponseEntity.noContent().build();
    }
    /**
     * Chạy thủ công batch expire promotion.
     *
     * POST /api/v1/promotions/expire-expired
     */
    @PostMapping("/expire-expired")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> expireExpiredPromotions() {
        int expiredCount = promotionService.expireExpiredPromotions();

        return ResponseEntity.ok(
                "Expired promotions updated: " + expiredCount
        );
    }
}