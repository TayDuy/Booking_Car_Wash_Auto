package com.autowash.backend.loyaltytier.repository;

import com.autowash.backend.loyaltytier.entity.LoyaltyTier;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface LoyaltyTierRepository extends JpaRepository<LoyaltyTier, Integer> {

    List<LoyaltyTier> findByIsActiveTrue();

    Optional<LoyaltyTier> findByTierName(String tierName);

    List<LoyaltyTier> findByIsActiveTrueOrderByMinPointsDesc();

    /**
     * Lấy danh sách tier đang active và sắp xếp từ hạng cao xuống thấp.
     *
     * priorityLevel càng lớn thì hạng càng cao.
     * Ví dụ:
     * - Platinum = 4
     * - Gold = 3
     * - Silver = 2
     * - Member = 1
     */
    List<LoyaltyTier> findByIsActiveTrueOrderByPriorityLevelDesc();

}