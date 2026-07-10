package com.autowash.backend.booking.scheduler;

import com.autowash.backend.booking.entity.Booking;
import com.autowash.backend.booking.enums.BookingStatus;
import com.autowash.backend.booking.repository.BookingRepository;
import com.autowash.backend.booking.service.BookingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;


@Component
@RequiredArgsConstructor
@Slf4j
public class BookingAutoCompleteScheduler {

    private static final long CHECK_INTERVAL_MS = 60_000L;
    private static final int AUTO_COMPLETE_AFTER_MINUTES = 20;

    private final BookingRepository bookingRepository;
    private final BookingService bookingService;

    @Scheduled(fixedRate = CHECK_INTERVAL_MS)
    public void autoCompleteInProgressBookings() {
        LocalDateTime deadLine = LocalDateTime.now().minusMinutes(AUTO_COMPLETE_AFTER_MINUTES);

        List<Booking> bookings = bookingRepository.findByStatusAndCheckInAtBefore(
                BookingStatus.in_progress,
                deadLine
        );

        for (Booking booking : bookings) {
            try {
                bookingService.completeBooking(booking.getBookingId());
            } catch (Exception e) {
                log.error("Auto complete booking {} thất bại: {}",
                        booking.getBookingId(),
                        e.getMessage(),
                        e);
            }
        }
    }

}
