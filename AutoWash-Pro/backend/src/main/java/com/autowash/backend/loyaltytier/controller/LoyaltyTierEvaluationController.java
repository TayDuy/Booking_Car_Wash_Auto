package com.autowash.backend.loyaltytier.controller;

import com.autowash.backend.loyaltytier.dto.CustomerTierEvaluationResponseDTO;
import com.autowash.backend.loyaltytier.service.LoyaltyTierEvaluationService;
import com.autowash.backend.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller xử lý API đánh giá và cập nhật hạng thành viên.
 *
 * CUSTOMER:
 * - Tự đánh giá hạng của chính mình.
 *
 * ADMIN:
 * - Đánh giá một customer bất kỳ.
 * - Đánh giá toàn bộ customer.
 *
 * STAFF / BRANCH_MANAGER:
 * - Đánh giá customer thuộc chi nhánh.
 */
@RestController
@RequestMapping("/api/v1/loyalty-tiers/evaluation")
@RequiredArgsConstructor
public class LoyaltyTierEvaluationController {

    private final LoyaltyTierEvaluationService loyaltyTierEvaluationService;

    /**
     * CUSTOMER tự đánh giá hạng của mình.
     *
     * POST /api/v1/loyalty-tiers/evaluation/me
     *
     * Dùng userId lấy từ JWT token, không truyền id thủ công.
     */
    @PostMapping("/me")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<CustomerTierEvaluationResponseDTO> evaluateMyTier(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return ResponseEntity.ok(
                loyaltyTierEvaluationService.evaluateCustomerTierByUserId(userDetails.getId())
        );
    }

    /**
     * ADMIN / STAFF / BRANCH_MANAGER đánh giá một customer cụ thể.
     *
     * POST /api/v1/loyalty-tiers/evaluation/customers/{customerId}
     *
     * Ở đây {customerId} là customer.customer_id, không phải account.user_id.
     */
    @PostMapping("/customers/{customerId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF', 'BRANCH_MANAGER')")
    public ResponseEntity<CustomerTierEvaluationResponseDTO> evaluateOneCustomer(
            @PathVariable Integer customerId
    ) {
        return ResponseEntity.ok(
                loyaltyTierEvaluationService.evaluateCustomerTierByCustomerId(customerId)
        );
    }

    /**
     * BRANCH_MANAGER / STAFF đánh giá toàn bộ customer thuộc một chi nhánh.
     *
     * POST /api/v1/loyalty-tiers/evaluation/branches/{branchId}/customers
     */
    @PostMapping("/branches/{branchId}/customers")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF', 'BRANCH_MANAGER')")
    public ResponseEntity<List<CustomerTierEvaluationResponseDTO>> evaluateCustomersByBranch(
            @PathVariable Integer branchId
    ) {
        return ResponseEntity.ok(
                loyaltyTierEvaluationService.evaluateCustomersByBranchId(branchId)
        );
    }

    /**
     * ADMIN đánh giá và cập nhật hạng cho toàn bộ customer trong hệ thống.
     *
     * POST /api/v1/loyalty-tiers/evaluation/customers
     */
    @PostMapping("/customers")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<CustomerTierEvaluationResponseDTO>> evaluateAllCustomers() {
        return ResponseEntity.ok(
                loyaltyTierEvaluationService.evaluateAllCustomers()
        );
    }
}