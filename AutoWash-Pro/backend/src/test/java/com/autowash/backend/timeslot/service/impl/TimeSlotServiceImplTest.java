package com.autowash.backend.timeslot.service.impl;

import com.autowash.backend.branch.entity.Branch;
import com.autowash.backend.branch.repository.BranchRepository;
import com.autowash.backend.timeslot.dto.TimeSlotRequestDTO;
import com.autowash.backend.timeslot.dto.TimeSlotResponseDTO;
import com.autowash.backend.timeslot.entity.TimeSlot;
import com.autowash.backend.timeslot.entity.TimeSlot.SlotStatus;
import com.autowash.backend.timeslot.mapper.TimeSlotMapper;
import com.autowash.backend.timeslot.repository.TimeSlotRepository;
import com.autowash.backend.washbay.entity.WashBay;
import com.autowash.backend.washbay.repository.WashBayRepository;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TimeSlotServiceImplTest {

    @Mock
    private TimeSlotRepository slotRepository;

    @Mock
    private BranchRepository branchRepository;

    @Mock
    private WashBayRepository washBayRepository;

    @Mock
    private TimeSlotMapper mapper;

    @InjectMocks
    private TimeSlotServiceImpl timeSlotService;

    @Test
    void testGetAvailableReturnsOnlyOpenSlots() {
        TimeSlot slot = TimeSlot.builder().slotId(1).status(SlotStatus.open).build();
        TimeSlotResponseDTO dto = TimeSlotResponseDTO.builder().slotId(1).status(SlotStatus.open).build();

        when(slotRepository.findByBranchAndDateAndStatus(1, LocalDate.of(2026, 7, 20), SlotStatus.open))
                .thenReturn(List.of(slot));
        when(mapper.toResponse(slot)).thenReturn(dto);

        List<TimeSlotResponseDTO> result = timeSlotService.getAvailable(1, LocalDate.of(2026, 7, 20));

        assertEquals(1, result.size());
        assertEquals(SlotStatus.open, result.get(0).getStatus());
    }

    @Test
    void testGetAvailableReturnsEmptyWhenNoSlots() {
        when(slotRepository.findByBranchAndDateAndStatus(anyInt(), any(), any()))
                .thenReturn(List.of());

        List<TimeSlotResponseDTO> result = timeSlotService.getAvailable(1, LocalDate.now());

        assertTrue(result.isEmpty());
    }

    @Test
    void testGetByIdSuccess() {
        TimeSlot slot = TimeSlot.builder().slotId(1).slotDate(LocalDate.of(2026, 7, 20)).build();
        TimeSlotResponseDTO dto = TimeSlotResponseDTO.builder().slotId(1).build();

        when(slotRepository.findById(1)).thenReturn(Optional.of(slot));
        when(mapper.toResponse(slot)).thenReturn(dto);

        TimeSlotResponseDTO result = timeSlotService.getById(1);

        assertNotNull(result);
        assertEquals(1, result.getSlotId());
    }

    @Test
    void testGetByIdNotFoundThrowsException() {
        when(slotRepository.findById(999)).thenReturn(Optional.empty());

        assertThrows(EntityNotFoundException.class, () -> timeSlotService.getById(999));
    }

    @Test
    void testCreateSuccess() {
        Branch branch = Branch.builder().branchId(1).build();
        WashBay bay = WashBay.builder().bayId(1).branch(branch).build();
        TimeSlotRequestDTO request = TimeSlotRequestDTO.builder()
                .branchId(1).bayId(1)
                .slotDate(LocalDate.of(2026, 7, 20))
                .startTime(LocalTime.of(9, 0))
                .endTime(LocalTime.of(9, 40))
                .build();
        TimeSlot entity = TimeSlot.builder()
                .slotDate(LocalDate.of(2026, 7, 20))
                .startTime(LocalTime.of(9, 0))
                .endTime(LocalTime.of(9, 40))
                .build();
        TimeSlot saved = TimeSlot.builder()
                .slotId(100).slotDate(LocalDate.of(2026, 7, 20))
                .startTime(LocalTime.of(9, 0)).endTime(LocalTime.of(9, 40))
                .status(SlotStatus.open).currentBookings(0).maxCapacity(1)
                .build();
        TimeSlotResponseDTO dto = TimeSlotResponseDTO.builder().slotId(100).status(SlotStatus.open).build();

        when(branchRepository.findById(1)).thenReturn(Optional.of(branch));
        when(washBayRepository.findById(1)).thenReturn(Optional.of(bay));
        when(slotRepository.existsByWashBay_BayIdAndSlotDateAndStartTime(1, LocalDate.of(2026, 7, 20), LocalTime.of(9, 0)))
                .thenReturn(false);
        when(slotRepository.findOverlapping(1, LocalDate.of(2026, 7, 20), LocalTime.of(9, 0), LocalTime.of(9, 40), null))
                .thenReturn(List.of());
        when(mapper.toEntity(request)).thenReturn(entity);
        when(slotRepository.save(any())).thenReturn(saved);
        when(mapper.toResponse(saved)).thenReturn(dto);

        TimeSlotResponseDTO result = timeSlotService.create(request);

        assertEquals(100, result.getSlotId());
        assertEquals(SlotStatus.open, result.getStatus());
    }

    @Test
    void testCreateEndTimeNotAfterStartThrowsException() {
        TimeSlotRequestDTO request = TimeSlotRequestDTO.builder()
                .startTime(LocalTime.of(10, 0))
                .endTime(LocalTime.of(9, 0))
                .build();

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> timeSlotService.create(request));
        assertEquals("Giờ kết thúc phải sau giờ bắt đầu", ex.getMessage());
    }

    @Test
    void testCreateDuplicateSlotThrowsException() {
        TimeSlotRequestDTO request = TimeSlotRequestDTO.builder()
                .branchId(1).bayId(1)
                .slotDate(LocalDate.of(2026, 7, 20))
                .startTime(LocalTime.of(9, 0))
                .endTime(LocalTime.of(9, 40))
                .build();

        when(slotRepository.existsByWashBay_BayIdAndSlotDateAndStartTime(1, LocalDate.of(2026, 7, 20), LocalTime.of(9, 0)))
                .thenReturn(true);

        assertThrows(IllegalArgumentException.class, () -> timeSlotService.create(request));
    }

    @Test
    void testCreateOverlappingSlotThrowsException() {
        TimeSlotRequestDTO request = TimeSlotRequestDTO.builder()
                .branchId(1).bayId(1)
                .slotDate(LocalDate.of(2026, 7, 20))
                .startTime(LocalTime.of(9, 0))
                .endTime(LocalTime.of(9, 40))
                .build();

        when(slotRepository.existsByWashBay_BayIdAndSlotDateAndStartTime(1, LocalDate.of(2026, 7, 20), LocalTime.of(9, 0)))
                .thenReturn(false);
        when(slotRepository.findOverlapping(1, LocalDate.of(2026, 7, 20), LocalTime.of(9, 0), LocalTime.of(9, 40), null))
                .thenReturn(List.of(TimeSlot.builder().slotId(99).build()));

        assertThrows(IllegalArgumentException.class, () -> timeSlotService.create(request));
    }

    @Test
    void testCreateBayNotInBranchThrowsException() {
        Branch branch1 = Branch.builder().branchId(1).build();
        Branch branch2 = Branch.builder().branchId(2).build();
        WashBay bay = WashBay.builder().bayId(1).branch(branch2).build();
        TimeSlotRequestDTO request = TimeSlotRequestDTO.builder()
                .branchId(1).bayId(1)
                .slotDate(LocalDate.of(2026, 7, 20))
                .startTime(LocalTime.of(9, 0))
                .endTime(LocalTime.of(9, 40))
                .build();

        when(branchRepository.findById(1)).thenReturn(Optional.of(branch1));
        when(washBayRepository.findById(1)).thenReturn(Optional.of(bay));
        when(slotRepository.existsByWashBay_BayIdAndSlotDateAndStartTime(anyInt(), any(), any())).thenReturn(false);
        when(slotRepository.findOverlapping(anyInt(), any(), any(), any(), any())).thenReturn(List.of());

        assertThrows(IllegalArgumentException.class, () -> timeSlotService.create(request));
    }

    @Test
    void testDeleteSlotWithNoBookingsSuccess() {
        TimeSlot slot = TimeSlot.builder().slotId(1).currentBookings(0).build();

        when(slotRepository.findById(1)).thenReturn(Optional.of(slot));

        timeSlotService.delete(1);

        verify(slotRepository).delete(slot);
    }

    @Test
    void testDeleteSlotWithBookingsThrowsException() {
        TimeSlot slot = TimeSlot.builder().slotId(1).currentBookings(2).build();

        when(slotRepository.findById(1)).thenReturn(Optional.of(slot));

        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> timeSlotService.delete(1));
        assertTrue(ex.getMessage().contains("2 booking"));
        verify(slotRepository, never()).delete(any());
    }

    @Test
    void testChangeStatusSuccess() {
        TimeSlot slot = TimeSlot.builder().slotId(1).status(SlotStatus.open).build();
        TimeSlot saved = TimeSlot.builder().slotId(1).status(SlotStatus.closed).build();
        TimeSlotResponseDTO dto = TimeSlotResponseDTO.builder().slotId(1).status(SlotStatus.closed).build();

        when(slotRepository.findById(1)).thenReturn(Optional.of(slot));
        when(slotRepository.save(any())).thenReturn(saved);
        when(mapper.toResponse(saved)).thenReturn(dto);

        TimeSlotResponseDTO result = timeSlotService.changeStatus(1, SlotStatus.closed);

        assertEquals(SlotStatus.closed, result.getStatus());
    }

    @Test
    void testGetByBranchAndDateReturnsAllStatuses() {
        TimeSlot openSlot = TimeSlot.builder().slotId(1).status(SlotStatus.open).build();
        TimeSlot fullSlot = TimeSlot.builder().slotId(2).status(SlotStatus.full).build();

        when(slotRepository.findByBranchAndDate(1, LocalDate.of(2026, 7, 20)))
                .thenReturn(List.of(openSlot, fullSlot));
        when(mapper.toResponse(openSlot)).thenReturn(TimeSlotResponseDTO.builder().slotId(1).status(SlotStatus.open).build());
        when(mapper.toResponse(fullSlot)).thenReturn(TimeSlotResponseDTO.builder().slotId(2).status(SlotStatus.full).build());

        List<TimeSlotResponseDTO> result = timeSlotService.getByBranchAndDate(1, LocalDate.of(2026, 7, 20));

        assertEquals(2, result.size());
    }
}
