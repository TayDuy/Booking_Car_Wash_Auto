package com.autowash.backend.booking.scheduler;

import com.autowash.backend.booking.entity.Booking;
import com.autowash.backend.booking.enums.BookingStatus;
import com.autowash.backend.booking.repository.BookingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Theo dõi các booking đang xử lý quá lâu.
 *
 * Scheduler này chỉ phát hiện và ghi log cảnh báo.
 * Không tự động chuyển booking sang completed.
 *
 * Việc hoàn thành booking phải được Employee thực hiện qua:
 * PATCH /api/v1/employee/bookings/{bookingId}/complete
 */
import org.springframework.jdbc.core.JdbcTemplate;

@Slf4j
@Component
@RequiredArgsConstructor
public class BookingOverdueScheduler {

    private final BookingRepository bookingRepository;
    private final JdbcTemplate jdbcTemplate;

    /**
     * Tự động quét và xử lý các booking ở quá khứ (slot_date < CURRENT_DATE hoặc đã quá giờ hẹn 30 phút).
     * - Booking chưa thanh toán (unpaid/pending/confirmed) -> Chuyển sang 'cancelled' (Đã hủy).
     * - Booking đã thanh toán (paid) nhưng không đến -> Chuyển sang 'no_show'.
     */
    @Scheduled(fixedDelay = 300000)
    @Transactional
    public void autoCancelExpiredPastBookings() {
        try {
            int cancelledUnpaid = jdbcTemplate.update("""
                UPDATE booking b
                SET status = 'cancelled', updated_at = NOW()
                FROM time_slot ts, payment p
                WHERE b.slot_id = ts.slot_id
                AND b.booking_id = p.booking_id
                AND b.status IN ('pending', 'confirmed')
                AND p.payment_status <> 'paid'
                AND (ts.slot_date < CURRENT_DATE OR (ts.slot_date = CURRENT_DATE AND ts.start_time < CURRENT_TIME - INTERVAL '30 minutes'))
            """);

            int noShowPaid = jdbcTemplate.update("""
                UPDATE booking b
                SET status = 'no_show', updated_at = NOW()
                FROM time_slot ts, payment p
                WHERE b.slot_id = ts.slot_id
                AND b.booking_id = p.booking_id
                AND b.status IN ('pending', 'confirmed')
                AND p.payment_status = 'paid'
                AND (ts.slot_date < CURRENT_DATE OR (ts.slot_date = CURRENT_DATE AND ts.start_time < CURRENT_TIME - INTERVAL '30 minutes'))
            """);

            int cancelledNoPaymentRecord = jdbcTemplate.update("""
                UPDATE booking b
                SET status = 'cancelled', updated_at = NOW()
                FROM time_slot ts
                WHERE b.slot_id = ts.slot_id
                AND b.status IN ('pending', 'confirmed')
                AND (ts.slot_date < CURRENT_DATE OR (ts.slot_date = CURRENT_DATE AND ts.start_time < CURRENT_TIME - INTERVAL '30 minutes'))
            """);

            if (cancelledUnpaid > 0 || noShowPaid > 0 || cancelledNoPaymentRecord > 0) {
                log.info("[BookingOverdue] Đã tự động dọn dẹp booking quá hạn — Hủy {} đơn chưa thanh toán, chuyển {} đơn sang no-show, dọn {} đơn chưa có payment.",
                        cancelledUnpaid, noShowPaid, cancelledNoPaymentRecord);
            }
        } catch (Exception e) {
            log.error("[BookingOverdue] Lỗi dọn dẹp booking quá hạn: {}", e.getMessage(), e);
        }
    }

    /**
     * Thời gian được xem là xử lý quá lâu.
     *
     * Có thể cấu hình:
     * app.booking.overdue-minutes=20
     */
    @Value("${app.booking.overdue-minutes:20}")
    private long overdueMinutes;

    /**
     * Mỗi 60 giây kiểm tra một lần.
     *
     * Có thể cấu hình:
     * app.booking.overdue-check-ms=60000
     */
    @Scheduled(
            fixedDelayString = "${app.booking.overdue-check-ms:60000}"
    )
    @Transactional(readOnly = true)
    public void checkOverdueBookings() {
        LocalDateTime deadline = LocalDateTime.now()
                .minusMinutes(overdueMinutes);

        List<Booking> overdueBookings =
                bookingRepository.findByStatusAndCheckInAtBefore(
                        BookingStatus.in_progress,
                        deadline
                );

        if (overdueBookings.isEmpty()) {
            return;
        }

        log.warn(
                "[BookingOverdue] Phát hiện {} booking đang xử lý quá {} phút",
                overdueBookings.size(),
                overdueMinutes
        );

        overdueBookings.forEach(this::logOverdueBooking);
    }

    private void logOverdueBooking(Booking booking) {
        Integer employeeId = booking.getAssignedStaff() != null
                ? booking.getAssignedStaff().getEmployeeId()
                : null;

        Integer branchId = booking.getBranch() != null
                ? booking.getBranch().getBranchId()
                : null;

        log.warn(
                "[BookingOverdue] bookingId={}, bookingCode={}, branchId={}, "
                        + "employeeId={}, checkInAt={}, status={}",
                booking.getBookingId(),
                booking.getBookingCode(),
                branchId,
                employeeId,
                booking.getCheckInAt(),
                booking.getStatus()
        );
    }
}