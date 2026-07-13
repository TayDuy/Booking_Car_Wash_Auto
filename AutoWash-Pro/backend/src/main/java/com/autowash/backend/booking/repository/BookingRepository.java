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

    // =========================================================
    // CUSTOMER QUERIES
    // =========================================================

    /**
     * Lấy booking của Customer, mới nhất trước.
     */
    List<Booking> findByCustomer_CustomerIdOrderByBookingDateDesc(
            Integer customerId
    );

    /**
     * Lấy booking của Customer kèm các quan hệ cần thiết.
     */
    @Query("""
            SELECT DISTINCT b
            FROM Booking b
            LEFT JOIN FETCH b.customer c
            LEFT JOIN FETCH c.user
            LEFT JOIN FETCH b.vehicle
            LEFT JOIN FETCH b.branch
            LEFT JOIN FETCH b.slot s
            LEFT JOIN FETCH s.washBay
            LEFT JOIN FETCH b.assignedStaff
            WHERE b.customer.customerId = :customerId
            ORDER BY b.bookingDate DESC
            """)
    List<Booking> findByCustomerWithAssociations(
            @Param("customerId") Integer customerId
    );

    /**
     * Lấy booking của Customer theo trạng thái.
     */
    @Query("""
            SELECT DISTINCT b
            FROM Booking b
            LEFT JOIN FETCH b.customer c
            LEFT JOIN FETCH c.user
            LEFT JOIN FETCH b.vehicle
            LEFT JOIN FETCH b.branch
            LEFT JOIN FETCH b.slot s
            LEFT JOIN FETCH s.washBay
            LEFT JOIN FETCH b.assignedStaff
            WHERE b.customer.customerId = :customerId
              AND b.status = :status
            ORDER BY b.bookingDate DESC
            """)
    List<Booking> findByCustomerWithAssociationsAndStatus(
            @Param("customerId") Integer customerId,
            @Param("status") BookingStatus status
    );

    Page<Booking> findByCustomer_CustomerId(
            Integer customerId,
            Pageable pageable
    );

    // =========================================================
    // ADMIN QUERIES
    // =========================================================

    /**
     * Admin lấy toàn bộ booking.
     */
    @Query("""
            SELECT DISTINCT b
            FROM Booking b
            LEFT JOIN FETCH b.customer c
            LEFT JOIN FETCH c.user
            LEFT JOIN FETCH b.vehicle
            LEFT JOIN FETCH b.branch
            LEFT JOIN FETCH b.slot s
            LEFT JOIN FETCH s.washBay
            LEFT JOIN FETCH b.assignedStaff
            ORDER BY b.priorityScore DESC, b.bookingDate ASC
            """)
    List<Booking> findAllWithAssociations();

    Page<Booking> findByBranch_BranchId(
            Integer branchId,
            Pageable pageable
    );

    List<Booking> findByBranch_BranchIdAndStatus(
            Integer branchId,
            BookingStatus status
    );

    // =========================================================
    // EMPLOYEE QUERIES
    // =========================================================

    /**
     * Lấy hàng chờ trong ngày của đúng chi nhánh Employee.
     *
     * Thứ tự:
     * 1. priorityScore cao hơn đứng trước.
     * 2. Nếu bằng điểm ưu tiên thì booking tạo sớm hơn đứng trước.
     *
     * Service sẽ truyền danh sách trạng thái cần lấy, ví dụ:
     * pending, confirmed, checked_in, in_progress.
     */
    @Query("""
            SELECT DISTINCT b
            FROM Booking b
            LEFT JOIN FETCH b.customer c
            LEFT JOIN FETCH c.user
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
            @Param("statuses") List<BookingStatus> statuses
    );

    /**
     * Employee xem chi tiết booking.
     *
     * Điều kiện branch được đặt ngay trong query để Employee không thể
     * xem booking của chi nhánh khác bằng cách đoán bookingId.
     */
    @Query("""
            SELECT DISTINCT b
            FROM Booking b
            LEFT JOIN FETCH b.customer c
            LEFT JOIN FETCH c.user
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
            @Param("branchId") Integer branchId
    );

    /**
     * Employee tìm booking bằng mã hoặc mã được quét từ QR.
     *
     * Chỉ trả booking thuộc chi nhánh của Employee.
     */
    @Query("""
            SELECT DISTINCT b
            FROM Booking b
            LEFT JOIN FETCH b.customer c
            LEFT JOIN FETCH c.user
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
            @Param("branchId") Integer branchId
    );

    // =========================================================
    // SLOT / WAITLIST QUERIES
    // =========================================================

    List<Booking> findBySlot_SlotIdAndStatusIn(
            Integer slotId,
            List<BookingStatus> statuses
    );

    /**
     * Lấy waitlist của một slot.
     */
    @Query("""
            SELECT b
            FROM Booking b
            WHERE b.slot.slotId = :slotId
              AND b.status = :status
            ORDER BY b.priorityScore DESC, b.bookingDate ASC
            """)
    List<Booking> findWaitlistBySlot(
            @Param("slotId") Integer slotId,
            @Param("status") BookingStatus status
    );

    /**
     * Kiểm tra xe có booking đang hoạt động hay không.
     */
    boolean existsByVehicle_VehicleIdAndStatusIn(
            Integer vehicleId,
            List<BookingStatus> statuses
    );

    /**
     * Hiện vẫn được BookingAutoCompleteScheduler sử dụng.
     * Scheduler sẽ được sửa ở bước sau để không tự động complete xe.
     */
    List<Booking> findByStatusAndCheckInAtBefore(
            BookingStatus status,
            LocalDateTime checkInAt
    );
}