package com.autowash.backend.timeslot.service;

import com.autowash.backend.timeslot.dto.TimeSlotRequestDTO;
import com.autowash.backend.timeslot.dto.TimeSlotResponseDTO;
import com.autowash.backend.timeslot.entity.TimeSlot.SlotStatus;

import java.time.LocalDate;
import java.util.List;

public interface TimeSlotService {

    /** FR-4: Lấy slot còn trống theo branch + ngày, dùng cho booking flow. */
    List<TimeSlotResponseDTO> getAvailable(Integer branchId, LocalDate date);

    /** Admin: lấy tất cả slot theo branch + ngày (kể cả full/closed). */
    List<TimeSlotResponseDTO> getByBranchAndDate(Integer branchId, LocalDate date);

    TimeSlotResponseDTO getById(Integer id);

    TimeSlotResponseDTO create(TimeSlotRequestDTO request);

    TimeSlotResponseDTO update(Integer id, TimeSlotRequestDTO request);

    /** Admin đóng slot thủ công (bảo trì, lễ...). */
    TimeSlotResponseDTO changeStatus(Integer id, SlotStatus status);

    void delete(Integer id);
}