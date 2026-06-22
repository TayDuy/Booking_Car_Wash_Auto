package com.autowash.backend.promotion.repository;

import com.autowash.backend.promotion.entity.PromotionUse;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PromotionUseRepository extends JpaRepository<PromotionUse, Integer> {

    boolean existsByPromotionIdAndCustomerId(Integer promotionId, Integer customerId);

    long countByPromotionId(Integer promotionId);

    List<PromotionUse> findByPromotionIdOrderByUsedAtDesc(Integer promotionId);

    List<PromotionUse> findByCustomerIdOrderByUsedAtDesc(Integer customerId);
}
