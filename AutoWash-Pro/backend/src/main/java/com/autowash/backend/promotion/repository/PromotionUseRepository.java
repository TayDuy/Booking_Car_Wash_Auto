package com.autowash.backend.promotion.repository;

import com.autowash.backend.promotion.entity.PromotionUse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface PromotionUseRepository extends JpaRepository<PromotionUse, Integer> {

    boolean existsByPromotionIdAndCustomerId(Integer promotionId, Integer customerId);

    long countByPromotionId(Integer promotionId);

    List<PromotionUse> findByPromotionIdOrderByUsedAtDesc(Integer promotionId);

    List<PromotionUse> findByCustomerIdOrderByUsedAtDesc(Integer customerId);

    @Modifying(clearAutomatically = true)
    @Transactional
    @Query("DELETE FROM PromotionUse p WHERE p.promotionId = :promotionId AND p.customerId = :customerId")
    void deleteByPromotionIdAndCustomerId(@Param("promotionId") Integer promotionId, @Param("customerId") Integer customerId);

    @Query("SELECT p.promotionId FROM PromotionUse p WHERE p.promotionId IN :ids AND p.customerId = :customerId")
    List<Integer> findUsedPromotionIds(@Param("ids") List<Integer> ids, @Param("customerId") Integer customerId);

    @Query("SELECT p.promotionId, COUNT(p) FROM PromotionUse p WHERE p.promotionId IN :ids GROUP BY p.promotionId")
    List<Object[]> countByPromotionIds(@Param("ids") List<Integer> ids);
}
