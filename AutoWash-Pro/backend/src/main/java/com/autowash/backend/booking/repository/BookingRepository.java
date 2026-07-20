package com.autowash.backend.booking.repository;

import com.autowash.backend.booking.entity.Booking;
import com.autowash.backend.booking.enums.BookingStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Integer> {

    Optional<Booking> findByBookingCode(String bookingCode);

    boolean existsByBookingCode(String bookingCode);

    List<Booking> findByCustomer_CustomerIdOrderByBookingDateDesc(Integer customerId);
    List<Booking> findByBookingDateGreaterThanEqualAndBookingDateLessThan(
        LocalDateTime fromDate,
        LocalDateTime toDateExclusive
    );

    /**
     * Admin - danh sách toàn bộ booking, sắp xếp mới đặt trước (mặc định).
     */
    @Query("""
        SELECT b FROM Booking b
        LEFT JOIN FETCH b.customer
        LEFT JOIN FETCH b.vehicle
        LEFT JOIN FETCH b.branch
        LEFT JOIN FETCH b.slot
        ORDER BY b.bookingDate DESC
        """)
    List<Booking> findAllWithAssociationsOrderByNewest();

    /**
     * Admin - danh sách toàn bộ booking, sắp xếp theo thứ hạng khách hàng
     * (priorityScore: Platinum > Gold > Silver > Member), cùng hạng thì
     * ai đặt trước xếp trước (FIFO).
     */
    @Query("""
        SELECT b FROM Booking b
        LEFT JOIN FETCH b.customer
        LEFT JOIN FETCH b.vehicle
        LEFT JOIN FETCH b.branch
        LEFT JOIN FETCH b.slot
        ORDER BY b.priorityScore DESC, b.bookingDate ASC
        """)
    List<Booking> findAllWithAssociationsOrderByPriority();

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

    @Query("""
            SELECT b FROM Booking b
            LEFT JOIN FETCH b.vehicle
            LEFT JOIN FETCH b.customer
            WHERE b.bookingId = :bookingId
            """)
    Optional<Booking> findByIdWithAssociations(@Param("bookingId") Integer bookingId);

    boolean existsByVehicle_VehicleIdAndStatusIn(Integer vehicleId, java.util.List<BookingStatus> statuses);

    List<Booking> findByStatusAndCheckInAtBefore(BookingStatus status, LocalDateTime checkInAt);

    @Query("""
            SELECT DISTINCT b FROM Booking b
            LEFT JOIN FETCH b.customer
            LEFT JOIN FETCH b.vehicle
            LEFT JOIN FETCH b.branch
            LEFT JOIN FETCH b.slot s
            LEFT JOIN FETCH s.washBay
            LEFT JOIN FETCH b.assignedStaff
            WHERE b.branch.branchId = :branchId
              AND s.slotDate = :slotDate
              AND b.status IN :statuses
            ORDER BY b.priorityScore DESC, b.bookingDate ASC
            """)
    List<Booking> findEmployeeQueue(
            @Param("branchId") Integer branchId,
            @Param("slotDate") LocalDate slotDate,
            @Param("statuses") List<BookingStatus> statuses);
    @Query(
            value = """
        SELECT DISTINCT b FROM Booking b
        LEFT JOIN FETCH b.customer
        LEFT JOIN FETCH b.vehicle
        LEFT JOIN FETCH b.branch
        LEFT JOIN FETCH b.slot s
        LEFT JOIN FETCH s.washBay
        LEFT JOIN FETCH b.assignedStaff
        WHERE b.branch.branchId = :branchId
          AND s.slotDate = :slotDate
          AND b.status IN :statuses
        ORDER BY b.priorityScore DESC, b.bookingDate ASC
        """,
            countQuery = """
        SELECT COUNT(b) FROM Booking b
        JOIN b.slot s
        WHERE b.branch.branchId = :branchId
          AND s.slotDate = :slotDate
          AND b.status IN :statuses
        """
    )
    Page<Booking> findEmployeeQueue(
            @Param("branchId") Integer branchId,
            @Param("slotDate") LocalDate slotDate,
            @Param("statuses") List<BookingStatus> statuses,
            Pageable pageable
    );

    @Query("""
            SELECT DISTINCT b FROM Booking b
            LEFT JOIN FETCH b.customer
            LEFT JOIN FETCH b.vehicle
            LEFT JOIN FETCH b.branch
            LEFT JOIN FETCH b.slot s
            LEFT JOIN FETCH s.washBay
            LEFT JOIN FETCH b.assignedStaff
            WHERE UPPER(b.bookingCode) = UPPER(:bookingCode)
              AND b.branch.branchId = :branchId
            """)
    Optional<Booking> findEmployeeBookingByCode(
            @Param("bookingCode") String bookingCode,
            @Param("branchId") Integer branchId);

    @Query("""
            SELECT DISTINCT b FROM Booking b
            LEFT JOIN FETCH b.customer
            LEFT JOIN FETCH b.vehicle
            LEFT JOIN FETCH b.branch
            LEFT JOIN FETCH b.slot s
            LEFT JOIN FETCH s.washBay
            LEFT JOIN FETCH b.assignedStaff
            WHERE b.bookingId = :bookingId
              AND b.branch.branchId = :branchId
            """)
    Optional<Booking> findEmployeeBookingById(
            @Param("bookingId") Integer bookingId,
            @Param("branchId") Integer branchId);
}