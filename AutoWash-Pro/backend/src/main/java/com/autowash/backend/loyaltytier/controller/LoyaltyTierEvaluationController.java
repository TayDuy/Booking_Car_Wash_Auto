package com.autowash.backend.loyaltytier.controller;

import com.autowash.backend.loyaltytier.dto.CustomerTierEvaluationResponseDTO;
import com.autowash.backend.loyaltytier.dto.CustomerTierResponseDTO;
import com.autowash.backend.loyaltytier.service.LoyaltyTierEvaluationService;
import com.autowash.backend.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/loyalty-tiers/evaluation")
@RequiredArgsConstructor
public class LoyaltyTierEvaluationController {

    private final LoyaltyTierEvaluationService loyaltyTierEvaluationService;

    @PostMapping("/me")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<CustomerTierEvaluationResponseDTO> evaluateMyTier(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return ResponseEntity.ok(
                loyaltyTierEvaluationService.evaluateCustomerTierByUserId(userDetails.getId())
        );
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<CustomerTierResponseDTO> getMyTier(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return ResponseEntity.ok(
                loyaltyTierEvaluationService.getCustomerTierByUserId(userDetails.getId())
        );
    }

    @PostMapping("/customers/{customerId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'EMPLOYEE')")
    public ResponseEntity<CustomerTierEvaluationResponseDTO> evaluateOneCustomer(
            @PathVariable("customerId") Integer customerId
    ) {
        return ResponseEntity.ok(
                loyaltyTierEvaluationService.evaluateCustomerTierByCustomerId(customerId)
        );
    }

    @PostMapping("/branches/{branchId}/customers")
    @PreAuthorize("hasAnyRole('ADMIN', 'EMPLOYEE')")
    public ResponseEntity<List<CustomerTierEvaluationResponseDTO>> evaluateCustomersByBranch(
            @PathVariable("branchId") Integer branchId
    ) {
        return ResponseEntity.ok(
                loyaltyTierEvaluationService.evaluateCustomersByBranchId(branchId)
        );
    }

    @PostMapping("/customers")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<CustomerTierEvaluationResponseDTO>> evaluateAllCustomers() {
        return ResponseEntity.ok(
                loyaltyTierEvaluationService.evaluateAllCustomers()
        );
    }
}