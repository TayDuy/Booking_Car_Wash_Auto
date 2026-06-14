package com.autowash.backend.reward.service;

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
}