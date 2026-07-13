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
@Slf4j
@Component
@RequiredArgsConstructor
public class BookingOverdueScheduler {

    private final BookingRepository bookingRepository;

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