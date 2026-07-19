package com.autowash.backend.payment.repository;

import com.autowash.backend.payment.entity.Payment;
import com.autowash.backend.payment.entity.Payment.PaymentStatus;
import com.autowash.backend.payment.entity.Payment.PaymentMethod;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Lock;
import jakarta.persistence.LockModeType;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * FR-5: Repository cho Payment.
 * Payment có quan hệ 1-1 với Booking — mỗi booking chỉ có 1 payment.
 * Khi paymentStatus = paid → service trigger loyalty earn event (FR-7).
 */
@Repository
public interface PaymentRepository extends JpaRepository<Payment, Integer> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Payment p WHERE p.paymentId = :id")
    Optional<Payment> findByIdForUpdate(@Param("id") Integer id);

    /**
     * Tìm payment theo bookingId — dùng khi booking completed để tạo/check payment.
     * Optional vì payment chỉ tạo sau khi booking completed, chưa chắc đã tồn tại.
     */
    Optional<Payment> findByBooking_BookingId(Integer bookingId);

    /**
     * Batch fetch payment theo nhiều bookingId — dùng để tránh N+1 khi map
     * danh sách booking (Manage Bookings, Booking History...).
     */
    List<Payment> findByBooking_BookingIdIn(List<Integer> bookingIds);

    /**
     * Kiểm tra booking đã có payment chưa — tránh tạo duplicate.
     * Dùng trước khi tạo payment mới.
     */
    boolean existsByBooking_BookingId(Integer bookingId);

    /**
     * Lấy danh sách payment theo trạng thái — dùng cho admin dashboard.
     * VD: lấy tất cả unpaid để nhắc nhở, hoặc paid để thống kê doanh thu.
     */
    List<Payment> findByPaymentStatus(PaymentStatus status);

    /**
     * Lấy danh sách payment theo phương thức thanh toán — dùng cho báo cáo.
     * VD: thống kê tỷ lệ cash vs bank_transfer vs pos.
     */
    List<Payment> findByPaymentMethod(PaymentMethod paymentMethod);

    /**
     * Tìm payment theo PayPal order id — dùng khi PayPal redirect về paypal-return
     * (query param "token") để xác định payment tương ứng cần capture.
     */
    Optional<Payment> findByPaypalOrderId(String paypalOrderId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Payment p WHERE p.paypalOrderId = :orderId")
    Optional<Payment> findByPaypalOrderIdForUpdate(@Param("orderId") String orderId);

    /**
     * FR-7: Lấy các payment đã paid trong khoảng thời gian — dùng để tính điểm loyalty.
     * Batch job chạy định kỳ hoặc admin reconcile cuối ngày.
     */
    @Query("""
            SELECT p FROM Payment p
            WHERE p.paymentStatus = :status
              AND p.paidAt BETWEEN :from AND :to
            ORDER BY p.paidAt ASC
            """)
    List<Payment> findByStatusBetween(@Param("status") PaymentStatus status,
                                      @Param("from") LocalDateTime from,
                                      @Param("to") LocalDateTime to);
}