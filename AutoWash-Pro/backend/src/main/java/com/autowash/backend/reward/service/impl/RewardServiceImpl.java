package com.autowash.backend.reward.service.impl;

import com.autowash.backend.reward.dto.RewardRequestDTO;
import com.autowash.backend.reward.dto.RewardResponseDTO;
import com.autowash.backend.reward.entity.Reward;
import com.autowash.backend.reward.mapper.RewardMapper;
import com.autowash.backend.reward.repository.RewardRepository;
import com.autowash.backend.reward.service.RewardService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Implementation của {@link RewardService}.
 *
 * <p>Toàn bộ class được đánh dấu {@code @Transactional(readOnly = true)} —
 * các method chỉ đọc sẽ dùng read-only transaction (tối ưu performance).
 * Các method ghi dữ liệu override thành {@code @Transactional} (readOnly = false).</p>
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RewardServiceImpl implements RewardService {

    private final RewardRepository rewardRepository;
    private final RewardMapper rewardMapper;

    /**
     * {@inheritDoc}
     *
     * <p>Flow: DTO → entity (mapper) → save → response DTO.</p>
     */
    @Override
    @Transactional
    public RewardResponseDTO create(RewardRequestDTO dto) {
        Reward reward = rewardMapper.toEntity(dto);
        Reward saved = rewardRepository.save(reward);
        return rewardMapper.toResponse(saved);
    }

    /**
     * {@inheritDoc}
     *
     * <p>Ném {@link EntityNotFoundException} nếu không tìm thấy —
     * GlobalExceptionHandler sẽ bắt và trả về HTTP 404.</p>
     */
    @Override
    public RewardResponseDTO getById(Integer id) {
        return rewardMapper.toResponse(findOrThrow(id));
    }

    /**
     * {@inheritDoc}
     *
     * <p>Trả về toàn bộ reward không phân trang.
     * Nếu dữ liệu lớn, cân nhắc chuyển sang {@code Page<RewardResponseDTO>}.</p>
     */
    @Override
    public List<RewardResponseDTO> getAll() {
        return rewardRepository.findAll()
                .stream()
                .map(rewardMapper::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * {@inheritDoc}
     *
     * <p>Dùng {@code updateEntityFromDto} để patch — chỉ field không null mới bị ghi đè,
     * tránh vô tình reset các field client không gửi lên.</p>
     */
    @Override
    @Transactional
    public RewardResponseDTO update(Integer id, RewardRequestDTO dto) {
        Reward reward = findOrThrow(id);
        rewardMapper.updateEntityFromDto(dto, reward);
        return rewardMapper.toResponse(rewardRepository.save(reward));
    }

    /**
     * {@inheritDoc}
     *
     * <p>Soft-delete bằng cách set {@code status = inactive}.
     * Giữ nguyên bản ghi trong DB để không làm mất lịch sử redemption
     * đã liên kết với reward này.</p>
     */
    @Override
    @Transactional
    public void deactivate(Integer id) {
        Reward reward = findOrThrow(id);
        reward.setStatus(Reward.RewardStatus.inactive);
        rewardRepository.save(reward);
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    /**
     * Tìm reward theo ID hoặc ném exception nếu không tồn tại.
     * Tập trung xử lý "not found" tại một chỗ, tránh lặp lại ở nhiều method.
     *
     * @param id primary key cần tìm
     * @return entity đang được JPA quản lý trong Persistence Context
     * @throws EntityNotFoundException nếu không tìm thấy reward với id tương ứng
     */
    private Reward findOrThrow(Integer id) {
        return rewardRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Reward không tồn tại, id=" + id));
    }
}