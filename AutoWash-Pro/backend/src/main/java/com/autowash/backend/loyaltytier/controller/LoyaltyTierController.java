package com.autowash.backend.loyaltytier.controller;

import com.autowash.backend.common.dto.ApiResponse;
import com.autowash.backend.loyaltytier.dto.LoyaltyTierSummaryDTO;
import com.autowash.backend.loyaltytier.entity.LoyaltyTier;
import com.autowash.backend.loyaltytier.repository.LoyaltyTierRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Danh sách hạng thành viên (read-only) — dùng cho admin chọn khi
 * gửi thông báo hàng loạt theo tier (FR-4: "Send to Silver+ only").
 *
 * <p>{@code GET /api/v1/loyalty-tiers}</p>
 */
@RestController
@RequestMapping("/api/v1/loyalty-tiers")
@RequiredArgsConstructor
public class LoyaltyTierController {

    private final LoyaltyTierRepository loyaltyTierRepository;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<LoyaltyTierSummaryDTO>>> getActiveTiers() {
        List<LoyaltyTierSummaryDTO> tiers = loyaltyTierRepository
                .findByIsActiveTrueOrderByPriorityLevelDesc()
                .stream()
                .map(this::toSummary)
                .toList();

        return ResponseEntity.ok(ApiResponse.success("Danh sách hạng thành viên", tiers));
    }

    private LoyaltyTierSummaryDTO toSummary(LoyaltyTier tier) {
        return LoyaltyTierSummaryDTO.builder()
                .tierId(tier.getTierId())
                .tierName(tier.getTierName())
                .priorityLevel(tier.getPriorityLevel())
                .build();
    }
}