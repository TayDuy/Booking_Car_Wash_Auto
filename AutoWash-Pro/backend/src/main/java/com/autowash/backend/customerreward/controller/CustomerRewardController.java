package com.autowash.backend.customerreward.controller;

import com.autowash.backend.customerreward.dto.CustomerRewardResponseDTO;
import com.autowash.backend.customerreward.service.CustomerRewardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/customer/rewards")
@RequiredArgsConstructor
public class CustomerRewardController {

    private final CustomerRewardService customerRewardService;

    /**
     * Customer đổi điểm lấy voucher.
     */
    @PostMapping("/{rewardId}/redeem")
    public ResponseEntity<CustomerRewardResponseDTO> redeemReward(
            @PathVariable Integer rewardId,
            @RequestParam Integer customerId
    ) {
        CustomerRewardResponseDTO response = customerRewardService.redeemReward(
                customerId,
                rewardId,
                null
        );

        return ResponseEntity.ok(response);
    }

    /**
     * Customer xem voucher đã đổi.
     */
    @GetMapping("/my/{customerId}")
    public ResponseEntity<List<CustomerRewardResponseDTO>> getMyRewards(
            @PathVariable Integer customerId
    ) {
        List<CustomerRewardResponseDTO> response =
                customerRewardService.getCustomerRewards(customerId, null);

        return ResponseEntity.ok(response);
    }

    @PatchMapping("/use")
    public ResponseEntity<CustomerRewardResponseDTO> useReward(
            @RequestParam String voucherCode,
            @RequestParam Integer bookingId
    ) {
        CustomerRewardResponseDTO response =
                customerRewardService.useReward(voucherCode, bookingId, null);

        return ResponseEntity.ok(response);
    }
}