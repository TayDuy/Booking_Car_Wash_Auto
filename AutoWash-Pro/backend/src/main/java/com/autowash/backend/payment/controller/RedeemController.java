package com.autowash.backend.payment.controller;

import com.autowash.backend.payment.dto.RedeemRequestDTO;
import com.autowash.backend.payment.dto.RedeemResponseDTO;
import com.autowash.backend.payment.service.RedeemService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * Controller xử lý luồng đổi điểm lấy reward của khách hàng (FR-7).
 *
 * <p>Base path: {@code /api/v1/redeem}</p>
 *
 * <p>Tách khỏi {@code RewardController} để phân biệt rõ trách nhiệm:
 * <ul>
 *   <li>{@code /rewards} — admin quản lý catalog reward (CRUD)</li>
 *   <li>{@code /redeem}  — khách hàng thực hiện đổi điểm</li>
 * </ul>
 * </p>
 */
@RestController
@RequestMapping("/api/v1/redeem")
@RequiredArgsConstructor
public class RedeemController {

    private final RedeemService redeemService;

    /**
     * Khách hàng đổi điểm lấy reward và áp dụng vào booking.
     *
     * <p>{@code POST /api/v1/redeem}</p>
     *
     * <p>Chỉ role {@code CUSTOMER} mới được gọi endpoint này.
     * Admin hoặc unauthenticated request sẽ nhận HTTP 403
     * từ {@code GlobalExceptionHandler.handleAccessDenied()}.</p>
     *
     * <p>Request body:
     * <pre>{@code
     * {
     *   "customerId": 42,
     *   "rewardId":   3,
     *   "bookingId":  101
     * }
     * }</pre>
     * </p>
     *
     * <p>Response 200:
     * <pre>{@code
     * {
     *   "loyaltyTransactionId": 88,
     *   "pointsDeducted":       -500,
     *   "balanceBefore":        1200,
     *   "balanceAfter":         700,
     *   "redeemedAt":           "2025-06-01T10:30:00",
     *   "rewardId":             3,
     *   "rewardName":           "Giảm 50.000 VND",
     *   "rewardType":           "discount",
     *   "rewardValue":          50000.00,
     *   "bookingId":            101,
     *   "paymentId":            55,
     *   "message":              "Đổi điểm thành công! Bạn được giảm 50000 VND..."
     * }
     * }</pre>
     * </p>
     *
     * <p>Các lỗi có thể trả về:
     * <ul>
     *   <li>HTTP 400 — request body không hợp lệ (thiếu field, sai format)</li>
     *   <li>HTTP 403 — không phải role CUSTOMER hoặc tài khoản bị vô hiệu hóa</li>
     *   <li>HTTP 404 — reward / customer / payment không tìm thấy</li>
     *   <li>HTTP 409 — không đủ điểm, reward inactive, hoặc booking đã dùng reward</li>
     * </ul>
     * </p>
     *
     * @param dto thông tin đổi điểm từ client (validated bởi {@code @Valid})
     * @return HTTP 200 kèm snapshot giao dịch {@link RedeemResponseDTO}
     */
    @PreAuthorize("hasRole('CUSTOMER')")  // Chỉ CUSTOMER mới được đổi điểm
    @PostMapping
    public ResponseEntity<RedeemResponseDTO> redeem(
            @Valid @RequestBody RedeemRequestDTO dto,
            @org.springframework.security.core.annotation.AuthenticationPrincipal com.autowash.backend.security.CustomUserDetails userDetails
    ) {
        // @Valid kích hoạt Bean Validation trên RedeemRequestDTO
        // Nếu vi phạm → MethodArgumentNotValidException → GlobalExceptionHandler → 400
        return ResponseEntity.ok(redeemService.redeem(dto, userDetails.getId()));
    }
}