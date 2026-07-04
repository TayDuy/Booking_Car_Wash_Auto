package com.autowash.backend.timeslot.dto;

import jakarta.validation.constraints.*;
import lombok.*;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.Set;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GenerateSlotsRequestDTO {

    @NotNull(message = "Branch ID không được null")
    private Integer branchId;

    @NotEmpty(message = "Phải chọn ít nhất 1 bay")
    private Set<Integer> bayIds;

    @NotNull(message = "Năm không được null")
    @Min(value = 2000, message = "Năm không hợp lệ")
    private Integer year;

    @NotNull(message = "Tháng không được null")
    @Min(value = 1, message = "Tháng phải từ 1 đến 12")
    @Max(value = 12, message = "Tháng phải từ 1 đến 12")
    private Integer month;

    @NotNull(message = "Giờ mở cửa không được null")
    private LocalTime openTime;

    @NotNull(message = "Giờ đóng cửa không được null")
    private LocalTime closeTime;

    @NotNull(message = "Thời lượng slot không được null")
    @Min(value = 5, message = "Thời lượng slot tối thiểu 5 phút")
    @Max(value = 480, message = "Thời lượng slot tối đa 8 tiếng")
    private Integer slotDurationMinutes;

    private LocalTime breakStart;
    private LocalTime breakEnd;

    private Set<DayOfWeek> daysOfWeek;

    @Min(value = 1, message = "Sức chứa tối thiểu là 1")
    @Max(value = 50, message = "Sức chứa tối đa là 50")
    @Builder.Default
    private Integer maxCapacity = 1;

    @Builder.Default
    private boolean skipExisting = true;

    @AssertTrue(message = "Giờ đóng cửa phải sau giờ mở cửa")
    private boolean isCloseAfterOpen() {
        if (openTime == null || closeTime == null) return true;
        return closeTime.isAfter(openTime);
    }

    @AssertTrue(message = "Giờ kết thúc nghỉ trưa phải sau giờ bắt đầu nghỉ trưa")
    private boolean isBreakValid() {
        if (breakStart == null && breakEnd == null) return true;
        if (breakStart == null || breakEnd == null) return false;
        return breakEnd.isAfter(breakStart);
    }
}