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

    // FR-4: tìm slot theo branch + ngày + status để hiển thị cho khách
    List<TimeSlot> findByBranch_BranchIdAndSlotDateAndStatus(
            Integer branchId, LocalDate slotDate, SlotStatus status);

    // FR-6: tìm slot còn chỗ để check trước khi book
    @Query("""
            SELECT t FROM TimeSlot t
            WHERE t.branch.branchId = :branchId
              AND t.slotDate = :slotDate
              AND t.status = 'open'
              AND t.currentBookings < t.maxCapacity
            """)
    List<TimeSlot> findAvailableSlots(@Param("branchId") Integer branchId,
                                      @Param("slotDate") LocalDate slotDate);

    boolean existsByWashBay_BayIdAndSlotDateAndStartTime(
            Integer bayId, LocalDate slotDate, java.time.LocalTime startTime);
}