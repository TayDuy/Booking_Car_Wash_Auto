package com.autowash.backend.reward.service;

import com.autowash.backend.reward.dto.RedeemRewardRequestDTO;
import com.autowash.backend.reward.dto.RedeemRewardResponseDTO;
import com.autowash.backend.reward.dto.RewardRequestDTO;
import com.autowash.backend.reward.dto.RewardResponseDTO;


import java.util.List;

/**
 * Contract của tầng service cho nghiệp vụ quản lý Reward (FR-7).
 *
 * <p>Mọi logic kiểm tra điểm, validate trạng thái, và ánh xạ DTO ↔ entity
 * đều nằm trong implementation — controller chỉ gọi interface này.</p>
 */
public interface RewardService {

    /**
     * Tạo mới một reward.
     *
     * @param dto thông tin reward từ client (đã qua Bean Validation)
     * @return reward vừa được lưu, bao gồm rewardId và createdAt do DB sinh ra
     */
    RewardResponseDTO create(RewardRequestDTO dto);

    /**
     * Lấy thông tin một reward theo ID.
     *
     * @param id primary key của reward
     * @return thông tin reward
     * @throws jakarta.persistence.EntityNotFoundException nếu không tồn tại
     */
    RewardResponseDTO getById(Integer id);

    /**
     * Lấy danh sách toàn bộ reward (active và inactive).
     * Nếu chỉ muốn lấy active, cân nhắc thêm method {@code getAllActive()} riêng.
     *
     * @return danh sách reward, rỗng nếu chưa có dữ liệu
     */
    List<RewardResponseDTO> getAll();

    /**
     * Cập nhật reward đã tồn tại — chỉ patch field được gửi lên (null = giữ nguyên).
     *
     * @param id  primary key của reward cần cập nhật
     * @param dto dữ liệu mới từ client
     * @return reward sau khi cập nhật
     * @throws jakarta.persistence.EntityNotFoundException nếu id không tồn tại
     */
    RewardResponseDTO update(Integer id, RewardRequestDTO dto);

    /**
     * Vô hiệu hóa reward (soft-delete) — đặt {@code status = inactive}.
     * Không xóa khỏi DB để giữ lịch sử redemption của khách hàng.
     *
     * @param id primary key của reward cần vô hiệu hóa
     * @throws jakarta.persistence.EntityNotFoundException nếu id không tồn tại
     */
    void deactivate(Integer id);

    /**
     * FR7: Lấy danh sách reward mà customer có thể đổi bằng điểm hiện tại.
     *
     * <p>Điều kiện lọc:</p>
     * <ul>
     *   <li>Reward đang active</li>
     *   <li>Customer đủ điểm để đổi</li>
     *   <li>Reward áp dụng cho đúng loại xe hoặc áp dụng cho cả hai loại xe</li>
     * </ul>
     *
     * @param customerId ID của customer
     * @param vehicleType loại xe của customer, ví dụ: car, motorbike, both
     * @return danh sách reward có thể đổi
     */
    List<RewardResponseDTO> getRedeemableRewards(Integer customerId, String vehicleType, Integer userId);

    /**
     * FR7: Customer đổi điểm lấy reward.
     *
     * <p>Flow xử lý:</p>
     * <ul>
     *   <li>Tìm reward theo rewardId</li>
     *   <li>Kiểm tra reward còn active không</li>
     *   <li>Kiểm tra reward có áp dụng cho loại xe này không</li>
     *   <li>Kiểm tra customer có đủ điểm không</li>
     *   <li>Trừ điểm bằng cách lưu một LoyaltyTransaction mới</li>
     * </ul>
     *
     * @param rewardId ID của reward muốn đổi
     * @param dto thông tin customer và loại xe
     * @return kết quả đổi reward, bao gồm điểm trước và sau khi đổi
     */
    RedeemRewardResponseDTO redeemReward(Integer rewardId, RedeemRewardRequestDTO dto, Integer userId);
}