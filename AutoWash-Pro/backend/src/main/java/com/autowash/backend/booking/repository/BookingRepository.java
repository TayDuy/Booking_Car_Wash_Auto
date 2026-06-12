package com.autowash.backend.booking.repository;

import com.autowash.backend.booking.entity.Booking;
import com.autowash.backend.booking.entity.Booking.BookingStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Integer> {

    Optional<Booking> findByBookingCode(String bookingCode);

    // Lấy booking của customer, mới nhất trước
    List<Booking> findByCustomer_CustomerIdOrderByBookingDateDesc(Integer customerId);

    Page<Booking> findByCustomer_CustomerId(Integer customerId, Pageable pageable);

    Page<Booking> findByBranch_BranchId(Integer branchId, Pageable pageable);

    List<Booking> findByBranch_BranchIdAndStatus(Integer branchId, BookingStatus status);

    List<Booking> findBySlot_SlotIdAndStatusIn(Integer slotId, List<BookingStatus> statuses);

    boolean existsByBookingCode(String bookingCode);

    // FR-6: lấy waitlist của slot, sort theo priority rồi FIFO
    @Query("""
            SELECT b FROM Booking b
            WHERE b.slot.slotId = :slotId
              AND b.status = 'pending'
            ORDER BY b.priorityScore DESC, b.bookingDate ASC
            """)
    List<Booking> findWaitlistBySlot(@Param("slotId") Integer slotId);
}