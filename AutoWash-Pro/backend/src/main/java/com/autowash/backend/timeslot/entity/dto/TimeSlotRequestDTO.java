package com.autowash.backend.timeslot.dto;

import com.autowash.backend.timeslot.entity.TimeSlot.SlotStatus;
import jakarta.validation.constraints.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalTime;

/**
 * DTO nhận dữ liệu từ client khi CREATE hoặc UPDATE time slot.
 * Client truyền branchId và bayId thay vì object đầy đủ
 * để tránh nhận dữ liệu thừa và lỗ hổng mass assignment.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TimeSlotRequestDTO {

    @NotNull(message = "Branch ID không được null")
    private Integer branchId;

    @NotNull(message = "Bay ID không được null")
    private Integer bayId;

    @NotNull(message = "Ngày không được null")
    @FutureOrPresent(message = "Ngày slot phải là hôm nay hoặc tương lai")
    private LocalDate slotDate;

    @NotNull(message = "Giờ bắt đầu không được null")
    private LocalTime startTime;

    @NotNull(message = "Giờ kết thúc không được null")
    private LocalTime endTime;

    @Min(value = 1, message = "Sức chứa tối thiểu là 1")
    @Max(value = 50, message = "Sức chứa tối đa là 50")
    private Integer maxCapacity;

    /**
     * Admin có thể chủ động set status khi tạo slot
     * (ví dụ: tạo slot nhưng đóng luôn do bảo trì).
     * Nếu null → service sẽ dùng default = open.
     */
    private SlotStatus status;
}