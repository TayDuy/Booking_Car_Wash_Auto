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

    /**
     * Customer đổi điểm lấy voucher.
     */
    @PostMapping("/{rewardId}/redeem")
    public ResponseEntity<CustomerRewardResponseDTO> redeemReward(
            @PathVariable Integer rewardId,
            @RequestParam Integer customerId,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        CustomerRewardResponseDTO response = customerRewardService.redeemReward(
                customerId,
                rewardId,
                userDetails.getId()
        );

        return ResponseEntity.ok(response);
    }

    /**
     * Customer xem voucher đã đổi.
     */
    @GetMapping("/my/{customerId}")
    public ResponseEntity<List<CustomerRewardResponseDTO>> getMyRewards(
            @PathVariable Integer customerId,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        List<CustomerRewardResponseDTO> response =
                customerRewardService.getCustomerRewards(customerId, userDetails.getId());

        return ResponseEntity.ok(response);
    }

    @PatchMapping("/use")
    public ResponseEntity<CustomerRewardResponseDTO> useReward(
            @RequestParam String voucherCode,
            @RequestParam Integer bookingId,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        CustomerRewardResponseDTO response =
                customerRewardService.useReward(voucherCode, bookingId, userDetails.getId());

        return ResponseEntity.ok(response);
    }
}