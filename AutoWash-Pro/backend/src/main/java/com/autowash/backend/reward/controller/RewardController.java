package com.autowash.backend.reward.controller;

import com.autowash.backend.reward.dto.RewardRequestDTO;
import com.autowash.backend.reward.dto.RewardResponseDTO;
import com.autowash.backend.reward.service.RewardService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import com.autowash.backend.reward.dto.RedeemRewardRequestDTO;
import com.autowash.backend.reward.dto.RedeemRewardResponseDTO;

@RestController
@RequestMapping("/api/v1/rewards")
@RequiredArgsConstructor
public class RewardController {

    private final RewardService rewardService;

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<RewardResponseDTO> create(@Valid @RequestBody RewardRequestDTO dto) {
        RewardResponseDTO response = rewardService.create(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<RewardResponseDTO>> getAll() {
        return ResponseEntity.ok(rewardService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<RewardResponseDTO> getById(@PathVariable("id") Integer id) {
        return ResponseEntity.ok(rewardService.getById(id));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<RewardResponseDTO> update(
            @PathVariable("id") Integer id,
            @Valid @RequestBody RewardRequestDTO dto) {
        return ResponseEntity.ok(rewardService.update(id, dto));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deactivate(@PathVariable("id") Integer id) {
        rewardService.deactivate(id);
        return ResponseEntity.noContent().build();
    }

    @PreAuthorize("hasAnyRole('CUSTOMER', 'EMPLOYEE', 'ADMIN')")
    @GetMapping("/redeemable")
    public ResponseEntity<List<RewardResponseDTO>> getRedeemableRewards(
            @RequestParam(name = "customerId") Integer customerId,
            @RequestParam(name = "vehicleType") String vehicleType,
            @AuthenticationPrincipal com.autowash.backend.security.CustomUserDetails userDetails
    ) {
        List<RewardResponseDTO> rewards =
                rewardService.getRedeemableRewards(customerId, vehicleType, userDetails.getId());

        return ResponseEntity.ok(rewards);
    }

    @PostMapping("/{id}/redeem")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'EMPLOYEE', 'ADMIN')")
    public ResponseEntity<RedeemRewardResponseDTO> redeemReward(
            @PathVariable("id") Integer rewardId,
            @Valid @RequestBody RedeemRewardRequestDTO dto,
            @AuthenticationPrincipal com.autowash.backend.security.CustomUserDetails userDetails
    ) {
        RedeemRewardResponseDTO response =
                rewardService.redeemReward(rewardId, dto, userDetails.getId());

        return ResponseEntity.ok(response);
    }
}