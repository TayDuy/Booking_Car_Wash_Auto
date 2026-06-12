package com.autowash.backend.reward.repository;

import com.autowash.backend.reward.entity.Reward;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * FR-7: Repository cho Reward.
 * Các query phục vụ 2 luồng:
 *   1. Khách xem catalog reward và chọn đổi điểm (findRedeemableByCustomer).
 *   2. Admin quản lý danh sách reward (findByStatus, findByRewardType).
 */
@Repository
public interface RewardRepository extends JpaRepository<Reward, Integer> {

    /**
     * Lấy tất cả reward theo status — dùng cho admin dashboard.
     */
    List<Reward> findByStatus(Reward.RewardStatus status);

    /**
     * Lấy reward theo loại — VD: admin muốn xem tất cả free_wash reward.
     */
    List<Reward> findByStatusAndRewardType(Reward.RewardStatus status, Reward.RewardType rewardType);

    /**
     * FR-7: Lấy reward khách có thể đổi dựa trên điểm hiện có.
     * Hệ thống chỉ hỗ trợ ô tô nên không cần lọc theo vehicleType.
     * Dùng để hiển thị catalog reward khả dụng cho khách.
     */
    @Query("""
            SELECT r FROM Reward r
            WHERE r.status = 'active'
              AND r.requiredPoints <= :customerPoints
            ORDER BY r.requiredPoints ASC
            """)
    List<Reward> findRedeemableByCustomer(@Param("customerPoints") Integer customerPoints);

    /**
     * Kiểm tra tên reward đã tồn tại chưa — tránh duplicate khi admin tạo mới.
     */
    boolean existsByRewardName(String rewardName);
}