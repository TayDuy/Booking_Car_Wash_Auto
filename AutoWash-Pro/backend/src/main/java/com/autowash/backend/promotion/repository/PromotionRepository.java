package com.autowash.backend.promotion.repository;

import com.autowash.backend.promotion.entity.Promotion;
import com.autowash.backend.promotion.entity.Promotion.PromotionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

/**
 * Repository cho Promotion.
 * Các query chủ yếu phục vụ 2 luồng:
 *   1. Khách chọn promotion khi booking (findValidForTier).
 *   2. Admin quản lý danh sách promotion (findByStatus, expireOutdated).
 */
@Repository
public interface PromotionRepository extends JpaRepository<Promotion, Integer> {

    /**
     * Lấy tất cả promotion đang active — dùng cho admin dashboard.
     */
    List<Promotion> findByStatus(PromotionStatus status);

    /**
     * Lấy promotion hợp lệ cho một tier cụ thể tại thời điểm hiện tại.
     * Bao gồm cả promotion không giới hạn tier (targetTier = null).
     * Dùng khi khách chọn promotion lúc thanh toán.
     */
    @Query("""
            SELECT p FROM Promotion p
            WHERE p.status = 'active'
              AND p.startDate <= :today
              AND p.endDate   >= :today
              AND (p.targetTier IS NULL OR p.targetTier.tierId = :tierId)
            ORDER BY p.discountValue DESC
            """)
    List<Promotion> findValidForTier(@Param("tierId") Integer tierId,
                                     @Param("today") LocalDate today);

    /**
     * Lấy tất cả promotion đã hết hạn nhưng status vẫn còn active.
     * Dùng cho batch job chạy hàng đêm để tự động chuyển status → expired.
     */
    @Query("""
            SELECT p FROM Promotion p
            WHERE p.status = 'active'
              AND p.endDate < :today
            """)
    List<Promotion> findExpiredButActive(@Param("today") LocalDate today);

    /**
     * Kiểm tra tên promotion đã tồn tại chưa — tránh duplicate khi admin tạo mới.
     */
    boolean existsByPromotionName(String promotionName);
}