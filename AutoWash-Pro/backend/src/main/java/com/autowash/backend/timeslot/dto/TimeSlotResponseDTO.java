package com.autowash.backend.timeslot.dto;

import com.autowash.backend.timeslot.entity.TimeSlot.SlotStatus;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

/**
 * DTO trả ra ngoài API.
 * Thay vì trả cả entity Branch/WashBay, chỉ trả ID + tên
 * để tránh N+1 và lộ dữ liệu không cần thiết.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TimeSlotResponseDTO {

    private Integer slotId;

    /** Thông tin branch — flatten thay vì nest object để client dễ dùng. */
    private Integer branchId;
    private String  branchName;

    /** Thông tin bay — tương tự branch. */
    private Integer bayId;
    private String  bayName;

    private LocalDate   slotDate;
    private LocalTime   startTime;
    private LocalTime   endTime;
    private Integer     maxCapacity;
    private Integer     currentBookings;
    private SlotStatus  status;

    /** Audit fields — client dùng để hiển thị lịch sử. */
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}