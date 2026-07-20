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

@RestController
@RequestMapping("/api/v1/loyalty-transactions")
@RequiredArgsConstructor
public class LoyaltyTransactionController {

    private final LoyaltyTransactionService loyaltyTransactionService;

    @GetMapping("/customers/{customerId}")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'ADMIN')")
    public ResponseEntity<List<LoyaltyTransactionResponseDTO>> getCustomerTransactions(
            @PathVariable("customerId") Integer customerId,
            @RequestParam(required = false, name = "transactionType") String transactionType
    ) {
        return ResponseEntity.ok(
                loyaltyTransactionService.getCustomerTransactions(
                        customerId,
                        transactionType
                )
        );
    }

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

    @GetMapping("/me/balance")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<LoyaltyBalanceResponseDTO> getMyBalance(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return ResponseEntity.ok(
                loyaltyTransactionService.getMyBalance(userDetails.getId())
        );
    }

    @GetMapping("/customers/{customerId}/balance")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'ADMIN')")
    public ResponseEntity<LoyaltyBalanceResponseDTO> getCustomerBalance(
            @PathVariable("customerId") Integer customerId
    ) {
        return ResponseEntity.ok(
                loyaltyTransactionService.getCustomerBalance(customerId)
        );
    }
}