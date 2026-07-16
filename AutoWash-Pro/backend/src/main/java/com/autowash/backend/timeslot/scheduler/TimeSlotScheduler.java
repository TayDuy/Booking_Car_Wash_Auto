package com.autowash.backend.timeslot.scheduler;

import com.autowash.backend.branch.repository.BranchRepository;
import com.autowash.backend.timeslot.dto.GenerateSlotsRequestDTO;
import com.autowash.backend.timeslot.service.TimeSlotService;
import com.autowash.backend.washbay.entity.WashBay;
import com.autowash.backend.washbay.repository.WashBayRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.time.YearMonth;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Component
@RequiredArgsConstructor
public class TimeSlotScheduler {

    private final BranchRepository   branchRepository;
    private final WashBayRepository  washBayRepository;
    private final TimeSlotService    timeSlotService;

    @Scheduled(cron = "0 0 1 * * *")
    public void autoGenerateMonthlySlots() {
        log.info("[TimeSlotScheduler] Bắt đầu tự động sinh time slot cho tất cả chi nhánh...");

        branchRepository.findAll().forEach(branch -> {
            if (!branch.isAcceptingBookings()) {
                log.info("[TimeSlotScheduler] Bỏ qua chi nhánh '{}' — đang ngừng hoạt động", branch.getBranchName());
                return;
            }

            Set<Integer> bayIds = washBayRepository
                    .findByBranch_BranchIdAndStatus(branch.getBranchId(), WashBay.BayStatus.available)
                    .stream()
                    .map(WashBay::getBayId)
                    .collect(Collectors.toSet());

            if (bayIds.isEmpty()) {
                log.warn("[TimeSlotScheduler] Chi nhánh '{}' không có bay nào khả dụng", branch.getBranchName());
                return;
            }

            for (int monthOffset = 0; monthOffset <= 1; monthOffset++) {
                YearMonth ym = YearMonth.now().plusMonths(monthOffset);
                try {
                    GenerateSlotsRequestDTO request = GenerateSlotsRequestDTO.builder()
                            .branchId(branch.getBranchId())
                            .bayIds(bayIds)
                            .year(ym.getYear())
                            .month(ym.getMonthValue())
                            .openTime(LocalTime.of(8, 0))
                            .closeTime(LocalTime.of(20, 0))
                            .slotDurationMinutes(120)
                            .maxCapacity(1)
                            .skipExisting(true)
                            .daysOfWeek(Set.of(
                                    DayOfWeek.MONDAY, DayOfWeek.TUESDAY,
                                    DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY,
                                    DayOfWeek.FRIDAY, DayOfWeek.SATURDAY,
                                    DayOfWeek.SUNDAY))
                            .build();

                    var result = timeSlotService.generateMonthlySlots(request);
                    log.info("[TimeSlotScheduler] '{}' tháng {}/{}: tạo {} slot, bỏ qua {} (đã tồn tại/quá khứ)",
                            branch.getBranchName(), ym.getMonthValue(), ym.getYear(),
                            result.getCreated(), result.getSkipped());
                } catch (Exception e) {
                    log.error("[TimeSlotScheduler] Lỗi khi sinh slot cho '{}' tháng {}/{}: {}",
                            branch.getBranchName(), ym.getMonthValue(), ym.getYear(), e.getMessage());
                }
            }
        });

        log.info("[TimeSlotScheduler] Hoàn tất tự động sinh time slot.");
    }
}
