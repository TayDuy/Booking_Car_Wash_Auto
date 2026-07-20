package com.autowash.backend.customerreward.controller;

import com.autowash.backend.customerreward.dto.CustomerRewardResponseDTO;
import com.autowash.backend.customerreward.service.CustomerRewardService;
import com.autowash.backend.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/customer/rewards")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('CUSTOMER', 'EMPLOYEE', 'ADMIN')")
public class CustomerRewardController {

    private final CustomerRewardService customerRewardService;

    @PostMapping("/{rewardId}/redeem")
    public ResponseEntity<CustomerRewardResponseDTO> redeemReward(
            @PathVariable("rewardId") Integer rewardId,
            @RequestParam(name = "customerId") Integer customerId,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        CustomerRewardResponseDTO response = customerRewardService.redeemReward(
                customerId,
                rewardId,
                userDetails.getId()
        );

        return ResponseEntity.ok(response);
    }

    @GetMapping("/my/{customerId}")
    public ResponseEntity<List<CustomerRewardResponseDTO>> getMyRewards(
            @PathVariable("customerId") Integer customerId,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        List<CustomerRewardResponseDTO> response =
                customerRewardService.getCustomerRewards(customerId, userDetails.getId());

        return ResponseEntity.ok(response);
    }
    @GetMapping("/admin/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<CustomerRewardResponseDTO>> getAllCustomerRewards() {
        return ResponseEntity.ok(
                customerRewardService.getAllCustomerRewards()
        );
    }


    @PatchMapping("/use")
    public ResponseEntity<CustomerRewardResponseDTO> useReward(
            @RequestParam(name = "voucherCode") String voucherCode,
            @RequestParam(name = "bookingId") Integer bookingId,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        CustomerRewardResponseDTO response =
                customerRewardService.useReward(voucherCode, bookingId, userDetails.getId());

        return ResponseEntity.ok(response);
    }
}