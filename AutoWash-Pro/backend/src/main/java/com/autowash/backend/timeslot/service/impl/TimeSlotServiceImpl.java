package com.autowash.backend.timeslot.service.impl;

import com.autowash.backend.branch.entity.Branch;
import com.autowash.backend.branch.repository.BranchRepository;
import com.autowash.backend.timeslot.dto.GenerateSlotsRequestDTO;
import com.autowash.backend.timeslot.dto.GenerateSlotsResponseDTO;
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

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.YearMonth;
import java.util.*;

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
        // FIX: trước đây gọi nhầm findByBranchAndDateAndStatus(..., open) — cùng query với
        // getAvailable() — khiến admin KHÔNG thấy được slot đã full/closed, sai với javadoc
        // "lấy tất cả slot (kể cả full/closed)". Đổi sang query không lọc status.
        return slotRepository
                .findByBranchAndDate(branchId, date)
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

        // FIX (trùng giờ): check ở trên chỉ bắt trường hợp start_time GIỐNG HỆT.
        // Vẫn cần check OVERLAP để chặn slot chồng giờ (vd 09:00-09:40 và
        // 09:30-10:00 cho cùng 1 bay) — nếu không, 2 khách sẽ được xếp
        // cùng 1 bay tại cùng thời điểm dù slot_id khác nhau.
        if (!slotRepository.findOverlapping(
                request.getBayId(), request.getSlotDate(),
                request.getStartTime(), request.getEndTime(), null).isEmpty()) {
            throw new IllegalArgumentException(
                    "Bay này đã có slot khác chồng khung giờ (" +
                            request.getStartTime() + " - " + request.getEndTime() + ")");
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

        // FIX (trùng giờ): sau khi merge bay/ngày/giờ mới vào entity, phải
        // check overlap lại — nếu không, sửa slot có thể tạo ra 2 slot
        // chồng giờ nhau trên cùng 1 bay giống hệt lỗi ở create().
        // excludeSlotId = id hiện tại để không tự so trùng với chính nó.
        if (!slotRepository.findOverlapping(
                entity.getWashBay().getBayId(), entity.getSlotDate(),
                entity.getStartTime(), entity.getEndTime(), entity.getSlotId()).isEmpty()) {
            throw new IllegalArgumentException(
                    "Bay này đã có slot khác chồng khung giờ (" +
                            entity.getStartTime() + " - " + entity.getEndTime() + ")");
        }

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

    @Override
    @Transactional
    public GenerateSlotsResponseDTO generateMonthlySlots(GenerateSlotsRequestDTO request) {

        Branch branch = findBranchOrThrow(request.getBranchId());

        List<WashBay> bays = washBayRepository.findAllById(request.getBayIds());
        if (bays.size() != request.getBayIds().size()) {
            throw new EntityNotFoundException("Một hoặc nhiều bay không tồn tại");
        }
        for (WashBay bay : bays) {
            if (!bay.getBranch().getBranchId().equals(branch.getBranchId())) {
                throw new IllegalArgumentException(
                        "Bay '" + bay.getBayName() + "' không thuộc chi nhánh này");
            }
        }

        // Số ngày thực tế của tháng — tự động 28/29/30/31, KHÔNG hard-code 30
        YearMonth yearMonth = YearMonth.of(request.getYear(), request.getMonth());
        int daysInMonth = yearMonth.lengthOfMonth();
        LocalDate firstDay = yearMonth.atDay(1);
        LocalDate lastDay = yearMonth.atEndOfMonth();

        Set<DayOfWeek> allowedDays = (request.getDaysOfWeek() == null || request.getDaysOfWeek().isEmpty())
                ? Set.of(DayOfWeek.values())
                : request.getDaysOfWeek();

        List<LocalTime[]> dailyRanges = buildDailyTimeRanges(
                request.getOpenTime(), request.getCloseTime(),
                request.getSlotDurationMinutes(),
                request.getBreakStart(), request.getBreakEnd());

        List<TimeSlot> toInsert = new ArrayList<>();
        List<String> skippedReasons = new ArrayList<>();
        int totalCandidates = 0;
        LocalDate today = LocalDate.now();

        for (WashBay bay : bays) {
            // 1 query duy nhất lấy hết slot hiện có của bay trong cả tháng
            List<TimeSlot> existing = slotRepository.findByWashBay_BayIdAndSlotDateBetween(
                    bay.getBayId(), firstDay, lastDay);
            Map<LocalDate, List<TimeSlot>> existingByDate = new HashMap<>();
            for (TimeSlot ts : existing) {
                existingByDate.computeIfAbsent(ts.getSlotDate(), d -> new ArrayList<>()).add(ts);
            }

            for (int day = 1; day <= daysInMonth; day++) {
                LocalDate date = yearMonth.atDay(day);

                if (date.isBefore(today)) {
                    skippedReasons.add(bay.getBayName() + " " + date + ": ngày trong quá khứ");
                    totalCandidates += dailyRanges.size();
                    continue;
                }
                if (!allowedDays.contains(date.getDayOfWeek())) {
                    continue;
                }

                List<TimeSlot> daySlots = existingByDate.computeIfAbsent(date, d -> new ArrayList<>());

                for (LocalTime[] range : dailyRanges) {
                    totalCandidates++;
                    LocalTime start = range[0];
                    LocalTime end = range[1];

                    boolean overlaps = daySlots.stream().anyMatch(ts ->
                            ts.getStartTime().isBefore(end) && ts.getEndTime().isAfter(start));

                    if (overlaps) {
                        if (!request.isSkipExisting()) {
                            throw new IllegalArgumentException(
                                    "Bay '" + bay.getBayName() + "' đã có slot chồng giờ " +
                                            date + " " + start + "-" + end);
                        }
                        skippedReasons.add(bay.getBayName() + " " + date + " " + start + "-" + end
                                + ": đã tồn tại/chồng giờ");
                        continue;
                    }

                    TimeSlot slot = TimeSlot.builder()
                            .branch(branch)
                            .washBay(bay)
                            .slotDate(date)
                            .startTime(start)
                            .endTime(end)
                            .maxCapacity(request.getMaxCapacity())
                            .status(SlotStatus.open)
                            .build();

                    toInsert.add(slot);
                    daySlots.add(slot);
                }
            }
        }

        List<TimeSlot> saved = slotRepository.saveAll(toInsert); // batch insert

        return GenerateSlotsResponseDTO.builder()
                .year(request.getYear())
                .month(request.getMonth())
                .daysInMonth(daysInMonth)
                .totalCandidates(totalCandidates)
                .created(saved.size())
                .skipped(skippedReasons.size())
                .skippedReasons(skippedReasons.stream().limit(50).toList())
                .build();
    }

    private List<LocalTime[]> buildDailyTimeRanges(
            LocalTime openTime, LocalTime closeTime, int durationMinutes,
            LocalTime breakStart, LocalTime breakEnd) {

        List<LocalTime[]> ranges = new ArrayList<>();
        LocalTime cursor = openTime;

        while (true) {
            LocalTime slotEnd = cursor.plusMinutes(durationMinutes);
            if (slotEnd.isAfter(closeTime) || slotEnd.isBefore(cursor)) {
                break;
            }

            boolean inBreak = breakStart != null && breakEnd != null
                    && cursor.isBefore(breakEnd) && slotEnd.isAfter(breakStart);

            if (!inBreak) {
                ranges.add(new LocalTime[]{cursor, slotEnd});
            }

            cursor = slotEnd;
            if (!cursor.isBefore(closeTime)) break;
        }
        return ranges;
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