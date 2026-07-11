package com.autowash.backend.booking.repository;

import com.autowash.backend.booking.entity.Booking;
import com.autowash.backend.booking.enums.BookingStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Integer> {

    Optional<Booking> findByBookingCode(String bookingCode);

    // Lấy booking của customer, mới nhất trước
    List<Booking> findByCustomer_CustomerIdOrderByBookingDateDesc(Integer customerId);

    @Query("""
        SELECT b FROM Booking b
        LEFT JOIN FETCH b.customer
        LEFT JOIN FETCH b.vehicle
        LEFT JOIN FETCH b.branch
        LEFT JOIN FETCH b.slot
        ORDER BY b.priorityScore DESC, b.bookingDate ASC
        """)
    List<Booking> findAllWithAssociations();

    @Query("""
            SELECT DISTINCT b FROM Booking b
            LEFT JOIN FETCH b.customer
            LEFT JOIN FETCH b.vehicle
            LEFT JOIN FETCH b.branch
            LEFT JOIN FETCH b.slot
            WHERE b.customer.customerId = :customerId
            ORDER BY b.bookingDate DESC
            """)
    List<Booking> findByCustomerWithAssociations(@Param("customerId") Integer customerId);

    Page<Booking> findByCustomer_CustomerId(Integer customerId, Pageable pageable);

    Page<Booking> findByBranch_BranchId(Integer branchId, Pageable pageable);

    List<Booking> findByBranch_BranchIdAndStatus(Integer branchId, BookingStatus status);

    List<Booking> findBySlot_SlotIdAndStatusIn(Integer slotId, List<BookingStatus> statuses);

    boolean existsByBookingCode(String bookingCode);

    // FR-6: lấy waitlist của slot, sort theo priority rồi FIFO
    @Query("""
            SELECT b FROM Booking b
            WHERE b.slot.slotId = :slotId
              AND b.status = :status
            ORDER BY b.priorityScore DESC, b.bookingDate ASC
            """)
    List<Booking> findWaitlistBySlot(@Param("slotId") Integer slotId, @Param("status") BookingStatus status);

    @Query("""
            SELECT DISTINCT b FROM Booking b
            LEFT JOIN FETCH b.customer
            LEFT JOIN FETCH b.vehicle
            LEFT JOIN FETCH b.branch
            LEFT JOIN FETCH b.slot
            WHERE b.customer.customerId = :customerId
              AND b.status = :status
            ORDER BY b.bookingDate DESC
            """)
    List<Booking> findByCustomerWithAssociationsAndStatus(
            @Param("customerId") Integer customerId,
            @Param("status") BookingStatus status);

    //Dùng cho FR2 :Kiểm tra xem xe có đang vướng lịch đặt nào chưa hoàn thành không
    boolean existsByVehicle_VehicleIdAndStatusIn(Integer vehicleId, java.util.List<BookingStatus> statuses);

    // Auto complete những booking đã check-in quá thời gian quy định.
    List<Booking> findByStatusAndCheckInAtBefore(BookingStatus status, LocalDateTime checkInAt);
}