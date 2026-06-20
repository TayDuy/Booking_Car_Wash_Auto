package com.autowash.backend.promotion.repository;

import com.autowash.backend.promotion.entity.Promotion;
import com.autowash.backend.promotion.entity.Promotion.PromotionStatus;
import com.autowash.backend.promotion.entity.Promotion.VehicleType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface PromotionRepository extends JpaRepository<Promotion, Integer> {

    List<Promotion> findByStatus(PromotionStatus status);

    /**
     * Lấy promotion hợp lệ cho khách theo:
     *   - tier (hoặc không giới hạn tier)
     *   - loại xe (hoặc không giới hạn loại xe)
     *   - giá trị đơn hàng >= minOrderValue (hoặc không yêu cầu)
     */
    @Query("""
            SELECT p FROM Promotion p
            WHERE p.status = 'active'
              AND p.startDate <= :today
              AND p.endDate   >= :today
              AND (p.targetTier IS NULL OR p.targetTier.tierId = :tierId)
              AND (p.vehicleType IS NULL OR p.vehicleType = :vehicleType)
              AND (p.minOrderValue IS NULL OR p.minOrderValue <= :orderValue)
            ORDER BY p.discountValue DESC
            """)
    List<Promotion> findValidForTierAndVehicle(
            @Param("tierId")      Integer tierId,
            @Param("vehicleType") VehicleType vehicleType,
            @Param("orderValue")  BigDecimal orderValue,
            @Param("today")       LocalDate today
    );

    /**
     * Lấy promotion đã hết hạn nhưng status vẫn active — dùng cho batch expire.
     */
    @Query("""
            SELECT p FROM Promotion p
            WHERE p.status = 'active'
              AND p.endDate < :today
            """)
    List<Promotion> findExpiredButActive(@Param("today") LocalDate today);

    boolean existsByPromotionName(String promotionName);
}