package com.autowash.backend.timeslot.repository;

import com.autowash.backend.timeslot.entity.TimeSlot;
import com.autowash.backend.timeslot.entity.TimeSlot.SlotStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface TimeSlotRepository extends JpaRepository<TimeSlot, Integer> {

    /**
     * FR-4: Tìm slot còn chỗ theo branch và ngày — dùng cho màn hình chọn giờ.
     * JOIN FETCH tránh N+1 khi mapper đọc branch.branchName và washBay.bayName.
     */
    @Query("""
            SELECT ts FROM TimeSlot ts
            JOIN FETCH ts.branch b
            JOIN FETCH ts.washBay wb
            WHERE b.branchId = :branchId
              AND ts.slotDate = :date
              AND ts.status   = :status
            ORDER BY ts.startTime
            """)
    List<TimeSlot> findByBranchAndDateAndStatus(
            @Param("branchId") Integer branchId,
            @Param("date")     LocalDate date,
            @Param("status")   SlotStatus status
    );

    /**
     * Kiểm tra trùng slot (cùng bay + ngày + giờ bắt đầu) trước khi INSERT.
     * Unique constraint trên DB là lưới an toàn cuối cùng,
     * check trước ở đây để trả lỗi rõ ràng hơn thay vì DataIntegrityViolationException.
     */
    boolean existsByWashBay_BayIdAndSlotDateAndStartTime(
            Integer bayId, LocalDate slotDate, java.time.LocalTime startTime
    );
}