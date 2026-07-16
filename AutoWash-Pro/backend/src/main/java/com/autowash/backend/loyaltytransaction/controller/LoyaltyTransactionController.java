package com.autowash.backend.loyaltytransaction.controller;

import com.autowash.backend.loyaltytransaction.dto.LoyaltyBalanceResponseDTO;
import com.autowash.backend.loyaltytransaction.dto.LoyaltyTransactionResponseDTO;
import com.autowash.backend.loyaltytransaction.service.LoyaltyTransactionService;
import com.autowash.backend.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller xử lý lịch sử điểm và số dư điểm của customer.
 */
@RestController
@RequestMapping("/api/v1/loyalty-transactions")
@RequiredArgsConstructor
public class LoyaltyTransactionController {

    private final LoyaltyTransactionService loyaltyTransactionService;

    /**
     * Lấy lịch sử giao dịch điểm của customer.
     *
     * Ví dụ:
     * GET /api/v1/loyalty-transactions/customers/1
     * GET /api/v1/loyalty-transactions/customers/1?transactionType=redeem
     */
    @GetMapping("/customers/{customerId}")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'ADMIN')")
    public ResponseEntity<List<LoyaltyTransactionResponseDTO>> getCustomerTransactions(
            @PathVariable Integer customerId,
            @RequestParam(required = false) String transactionType
    ) {
        return ResponseEntity.ok(
                loyaltyTransactionService.getCustomerTransactions(
                        customerId,
                        transactionType
                )
        );
    }

    /**
     * CUSTOMER xem lịch sử giao dịch của chính mình.
     *
     * GET /api/v1/loyalty-transactions/me
     */
    @GetMapping("/me")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<List<LoyaltyTransactionResponseDTO>> getMyTransactions(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam(required = false) String transactionType
    ) {
        return ResponseEntity.ok(
                loyaltyTransactionService.getMyTransactions(userDetails.getId(), transactionType)
        );
    }

    /**
     * CUSTOMER xem số dư điểm của chính mình.
     *
     * GET /api/v1/loyalty-transactions/me/balance
     */
    @GetMapping("/me/balance")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<LoyaltyBalanceResponseDTO> getMyBalance(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return ResponseEntity.ok(
                loyaltyTransactionService.getMyBalance(userDetails.getId())
        );
    }

    /**
     * Lấy số điểm hiện tại của customer.
     *
     * GET /api/v1/loyalty-transactions/customers/1/balance
     */
    @GetMapping("/customers/{customerId}/balance")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'ADMIN')")
    public ResponseEntity<LoyaltyBalanceResponseDTO> getCustomerBalance(
            @PathVariable Integer customerId
    ) {
        return ResponseEntity.ok(
                loyaltyTransactionService.getCustomerBalance(customerId)
        );
    }
}
