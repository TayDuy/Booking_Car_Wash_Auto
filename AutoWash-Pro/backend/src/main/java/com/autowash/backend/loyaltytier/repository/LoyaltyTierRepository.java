package com.autowash.backend.loyaltytier.repository;

import com.autowash.backend.loyaltytier.entity.LoyaltyTier;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface LoyaltyTierRepository extends JpaRepository<LoyaltyTier, Integer> {

    List<LoyaltyTier> findByIsActiveTrue();

    Optional<LoyaltyTier> findByTierName(String tierName);

    List<LoyaltyTier> findByIsActiveTrueOrderByMinPointsDesc();
}