package com.autowash.backend.loyaltytier.controller;

import com.autowash.backend.loyaltytier.dto.CustomerTierEvaluationResponseDTO;
import com.autowash.backend.loyaltytier.service.LoyaltyTierEvaluationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
/**
 * Controller xử lý API đánh giá và cập nhật hạng thành viên.
 */
@RestController
@RequestMapping("/api/v1/loyalty-tiers/evaluation")
@RequiredArgsConstructor
public class LoyaltyTierEvaluationController {

    private final LoyaltyTierEvaluationService loyaltyTierEvaluationService;
    /**
     * Đánh giá và cập nhật hạng cho một customer.
     *
     * POST /api/v1/loyalty-tiers/evaluation/customers/{customerId}
     */
    @PostMapping("/customers/{customerId}")
    public ResponseEntity<CustomerTierEvaluationResponseDTO> evaluateOneCustomer(
            @PathVariable Integer customerId
    ) {
        return ResponseEntity.ok(
                loyaltyTierEvaluationService.evaluateCustomerTier(customerId)
        );
    }
    /**
     * Đánh giá và cập nhật hạng cho toàn bộ customer.
     *
     * POST /api/v1/loyalty-tiers/evaluation/customers
     */
    @PostMapping("/customers")
    public ResponseEntity<List<CustomerTierEvaluationResponseDTO>> evaluateAllCustomers() {
        return ResponseEntity.ok(
                loyaltyTierEvaluationService.evaluateAllCustomers()
        );
    }
}
