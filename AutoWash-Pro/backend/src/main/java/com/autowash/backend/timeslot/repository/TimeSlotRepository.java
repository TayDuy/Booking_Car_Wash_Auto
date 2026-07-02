package com.autowash.backend.timeslot.repository;

import com.autowash.backend.timeslot.entity.TimeSlot;
import com.autowash.backend.timeslot.entity.TimeSlot.SlotStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

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

    /**
     * Tìm các slot của cùng 1 bay, cùng ngày, có khung giờ CHỒNG LẤN với
     * [startTime, endTime) đang xét — chặn trường hợp start_time khác nhau
     * nhưng khoảng giờ vẫn giao nhau (vd 09:00-09:40 và 09:30-10:00).
     * excludeSlotId dùng khi update() để không tự so trùng với chính slot đang sửa
     * (truyền null khi tạo mới).
     */
    @Query("""
            SELECT ts FROM TimeSlot ts
            WHERE ts.washBay.bayId = :bayId
              AND ts.slotDate = :slotDate
              AND ts.startTime < :endTime
              AND ts.endTime > :startTime
              AND (:excludeSlotId IS NULL OR ts.slotId <> :excludeSlotId)
            """)
    List<TimeSlot> findOverlapping(
            @Param("bayId") Integer bayId,
            @Param("slotDate") LocalDate slotDate,
            @Param("startTime") java.time.LocalTime startTime,
            @Param("endTime") java.time.LocalTime endTime,
            @Param("excludeSlotId") Integer excludeSlotId
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT ts FROM TimeSlot ts WHERE ts.slotId = :slotId")
    Optional<TimeSlot> findByIdForUpdate(@Param("slotId") Integer slotId);

    /**
     * Sinh hàng loạt slot (generate cho cả tháng): lấy TOÀN BỘ slot đã tồn tại
     * của 1 bay trong khoảng ngày [from, to] bằng ĐÚNG 1 QUERY.
     */
    List<TimeSlot> findByWashBay_BayIdAndSlotDateBetween(
            Integer bayId, LocalDate from, LocalDate to
    );

}