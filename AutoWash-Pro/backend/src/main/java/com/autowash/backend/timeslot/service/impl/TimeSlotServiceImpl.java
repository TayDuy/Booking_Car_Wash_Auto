package com.autowash.backend.timeslot.service.impl;

import com.autowash.backend.branch.entity.Branch;
import com.autowash.backend.branch.repository.BranchRepository;
import com.autowash.backend.timeslot.dto.TimeSlotRequestDTO;
import com.autowash.backend.timeslot.dto.TimeSlotResponseDTO;
import com.autowash.backend.timeslot.entity.TimeSlot;
import com.autowash.backend.timeslot.entity.TimeSlot.SlotStatus;
import com.autowash.backend.timeslot.mapper.TimeSlotMapper;
import com.autowash.backend.timeslot.repository.TimeSlotRepository;
import com.autowash.backend.timeslot.service.TimeSlotService;
import com.autowash.backend.washbay.entity.WashBay;
import com.autowash.backend.washbay.repository.WashBayRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TimeSlotServiceImpl implements TimeSlotService {

    private final TimeSlotRepository   slotRepository;
    private final BranchRepository     branchRepository;
    private final WashBayRepository    washBayRepository;
    private final TimeSlotMapper       mapper;

    @Override
    public List<TimeSlotResponseDTO> getAvailable(Integer branchId, LocalDate date) {
        return slotRepository
                .findByBranchAndDateAndStatus(branchId, date, SlotStatus.open)
                .stream()
                .map(mapper::toResponse)
                .toList();
    }

    @Override
    public List<TimeSlotResponseDTO> getByBranchAndDate(Integer branchId, LocalDate date) {
        // Dùng lại query có JOIN FETCH, lọc status ở Java để tránh thêm query
        return slotRepository
                .findByBranchAndDateAndStatus(branchId, date, SlotStatus.open)
                .stream()
                .map(mapper::toResponse)
                .toList();
    }

    @Override
    public TimeSlotResponseDTO getById(Integer id) {
        return mapper.toResponse(findOrThrow(id));
    }

    @Override
    @Transactional
    public TimeSlotResponseDTO create(TimeSlotRequestDTO request) {
        // Validate thời gian hợp lệ
        if (!request.getEndTime().isAfter(request.getStartTime())) {
            throw new IllegalArgumentException("Giờ kết thúc phải sau giờ bắt đầu");
        }

        // Kiểm tra trùng slot (bay + ngày + giờ bắt đầu)
        if (slotRepository.existsByWashBay_BayIdAndSlotDateAndStartTime(
                request.getBayId(), request.getSlotDate(), request.getStartTime())) {
            throw new IllegalArgumentException("Bay này đã có slot tại khung giờ đó");
        }

        Branch  branch  = findBranchOrThrow(request.getBranchId());
        WashBay washBay = findBayOrThrow(request.getBayId());

        // Validate bay thuộc branch
        if (!washBay.getBranch().getBranchId().equals(branch.getBranchId())) {
            throw new IllegalArgumentException("Bay không thuộc chi nhánh này");
        }

        TimeSlot entity = mapper.toEntity(request);
        entity.setBranch(branch);
        entity.setWashBay(washBay);

        return mapper.toResponse(slotRepository.save(entity));
    }

    @Override
    @Transactional
    public TimeSlotResponseDTO update(Integer id, TimeSlotRequestDTO request) {
        TimeSlot entity = findOrThrow(id);

        if (request.getEndTime() != null && request.getStartTime() != null
                && !request.getEndTime().isAfter(request.getStartTime())) {
            throw new IllegalArgumentException("Giờ kết thúc phải sau giờ bắt đầu");
        }

        // Đổi branch nếu client truyền branchId mới
        if (request.getBranchId() != null
                && !request.getBranchId().equals(entity.getBranch().getBranchId())) {
            entity.setBranch(findBranchOrThrow(request.getBranchId()));
        }

        // Đổi bay nếu client truyền bayId mới
        if (request.getBayId() != null
                && !request.getBayId().equals(entity.getWashBay().getBayId())) {
            entity.setWashBay(findBayOrThrow(request.getBayId()));
        }

        mapper.updateEntity(request, entity);
        return mapper.toResponse(slotRepository.save(entity));
    }

    @Override
    @Transactional
    public TimeSlotResponseDTO changeStatus(Integer id, SlotStatus status) {
        TimeSlot entity = findOrThrow(id);
        entity.setStatus(status);
        return mapper.toResponse(slotRepository.save(entity));
    }

    @Override
    @Transactional
    public void delete(Integer id) {
        // Hard delete — chỉ dùng khi slot chưa có booking nào
        TimeSlot entity = findOrThrow(id);
        if (entity.getCurrentBookings() > 0) {
            throw new IllegalStateException(
                    "Không thể xóa slot đã có " + entity.getCurrentBookings() + " booking"
            );
        }
        slotRepository.delete(entity);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private TimeSlot findOrThrow(Integer id) {
        return slotRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Không tìm thấy time slot với id = " + id));
    }

    private Branch findBranchOrThrow(Integer id) {
        return branchRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Không tìm thấy branch với id = " + id));
    }

    private WashBay findBayOrThrow(Integer id) {
        return washBayRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Không tìm thấy wash bay với id = " + id));
    }
}