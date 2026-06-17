package com.autowash.backend.washbay.service.impl;

import com.autowash.backend.branch.entity.Branch;
import com.autowash.backend.branch.repository.BranchRepository;
import com.autowash.backend.common.exception.ResourceNotFoundException;
import com.autowash.backend.washbay.dto.WashBayRequestDTO;
import com.autowash.backend.washbay.dto.WashBayResponseDTO;
import com.autowash.backend.washbay.entity.WashBay;
import com.autowash.backend.washbay.entity.WashBay.BayStatus;
import com.autowash.backend.washbay.mapper.WashBayMapper;
import com.autowash.backend.washbay.repository.WashBayRepository;
import com.autowash.backend.washbay.service.WashBayService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Triển khai nghiệp vụ quản lý WashBay.
 *
 * <p>Mỗi method đều bao trong {@code @Transactional} để đảm bảo
 * tính atomic — nếu có lỗi giữa chừng, toàn bộ thay đổi sẽ rollback.</p>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class WashBayServiceImpl implements WashBayService {

    private final WashBayRepository washBayRepository;
    private final BranchRepository  branchRepository;
    private final WashBayMapper     mapper;

    // ── CREATE ────────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public WashBayResponseDTO create(WashBayRequestDTO dto) {
        Branch branch = loadBranch(dto.getBranchId());

        WashBay bay = WashBay.builder()
                .branch(branch)
                .bayName(dto.getBayName())
                // Nếu client không truyền status/capacity → dùng default
                .status(dto.getStatus()    != null ? dto.getStatus()    : BayStatus.available)
                .capacity(dto.getCapacity() != null ? dto.getCapacity() : 1)
                .build();

        WashBay saved = washBayRepository.save(bay);
        log.info("Created WashBay id={} branchId={}", saved.getBayId(), dto.getBranchId());
        return mapper.toResponse(saved);
    }

    // ── READ ──────────────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public WashBayResponseDTO getById(Integer bayId) {
        return mapper.toResponse(loadBay(bayId));
    }

    @Override
    @Transactional(readOnly = true)
    public List<WashBayResponseDTO> getAll() {
        return washBayRepository.findAll()
                .stream().map(mapper::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<WashBayResponseDTO> getByBranch(Integer branchId) {
        loadBranch(branchId); // validate branch tồn tại trước khi query
        return washBayRepository.findByBranch_BranchId(branchId)
                .stream().map(mapper::toResponse).toList();
    }

    // ── UPDATE ────────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public WashBayResponseDTO update(Integer bayId, WashBayRequestDTO dto) {
        WashBay bay = loadBay(bayId);

        // Chỉ cập nhật field nào client truyền lên (partial update)
        if (dto.getBranchId()  != null) bay.setBranch(loadBranch(dto.getBranchId()));
        if (dto.getBayName()   != null) bay.setBayName(dto.getBayName());
        if (dto.getStatus()    != null) bay.setStatus(dto.getStatus());
        if (dto.getCapacity()  != null) bay.setCapacity(dto.getCapacity());

        return mapper.toResponse(washBayRepository.save(bay));
    }

    @Override
    @Transactional
    public WashBayResponseDTO updateStatus(Integer bayId, BayStatus status) {
        WashBay bay = loadBay(bayId);
        bay.setStatus(status);
        log.info("WashBay id={} status → {}", bayId, status);
        return mapper.toResponse(washBayRepository.save(bay));
    }

    // ── DELETE ────────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public void delete(Integer bayId) {
        WashBay bay = loadBay(bayId);
        washBayRepository.delete(bay);
        log.info("Deleted WashBay id={}", bayId);
    }

    // ── HELPERS ───────────────────────────────────────────────────────────────

    /**
     * Load WashBay theo ID, ném {@code ResourceNotFoundException} nếu không tìm thấy.
     * Dùng chung cho tất cả method cần validate bay tồn tại.
     */
    private WashBay loadBay(Integer bayId) {
        return washBayRepository.findById(bayId)
                .orElseThrow(() -> new ResourceNotFoundException("WashBay", "id", bayId));
    }

    /**
     * Load Branch theo ID, ném {@code ResourceNotFoundException} nếu không tìm thấy.
     * Dùng khi tạo mới bay hoặc chuyển bay sang chi nhánh khác.
     */
    private Branch loadBranch(Integer branchId) {
        return branchRepository.findById(branchId)
                .orElseThrow(() -> new ResourceNotFoundException("Branch", "id", branchId));
    }
}