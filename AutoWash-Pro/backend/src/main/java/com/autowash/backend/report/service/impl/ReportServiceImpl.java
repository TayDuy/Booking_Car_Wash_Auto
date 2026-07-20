package com.autowash.backend.report.service.impl;

import com.autowash.backend.booking.entity.Booking;
import com.autowash.backend.booking.entity.BookingDetail;
import com.autowash.backend.booking.enums.BookingStatus;
import com.autowash.backend.booking.repository.BookingDetailRepository;
import com.autowash.backend.booking.repository.BookingRepository;
import com.autowash.backend.branch.repository.BranchRepository;
import com.autowash.backend.customer.repository.CustomerRepository;
import com.autowash.backend.report.dto.DashboardReportDTO;
import com.autowash.backend.report.service.ReportService;
import com.autowash.backend.servicepackage.repository.ServicePackageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class ReportServiceImpl implements ReportService {

    private final BookingRepository bookingRepository;
    private final BookingDetailRepository bookingDetailRepository;
    private final CustomerRepository customerRepository;
    private final BranchRepository branchRepository;
    private final ServicePackageRepository servicePackageRepository;

    @Override
    public DashboardReportDTO getDashboardReport(
        LocalDate fromDate,
        LocalDate toDate
    ) {
        List<Booking> bookings;

        if (fromDate != null && toDate != null) {
                if (fromDate.isAfter(toDate)) {
                throw new IllegalArgumentException(
                        "Ngày bắt đầu không được sau ngày kết thúc."
                );
                }

                bookings =
                        bookingRepository
                                .findByBookingDateGreaterThanEqualAndBookingDateLessThan(
                                        fromDate.atStartOfDay(),
                                        toDate.plusDays(1).atStartOfDay()
                                );
        } else {
                bookings = bookingRepository.findAll();
        }

        long completed = bookings.stream()
        .filter(b -> BookingStatus.completed.equals(b.getStatus()))
        .count();

        long pending = bookings.stream()
                .filter(b -> BookingStatus.pending.equals(b.getStatus()))
                .count();

        long confirmed = bookings.stream()
                .filter(b -> BookingStatus.confirmed.equals(b.getStatus()))
                .count();

        long checkedIn = bookings.stream()
                .filter(b -> BookingStatus.checked_in.equals(b.getStatus()))
                .count();

        long inProgress = bookings.stream()
                .filter(b -> BookingStatus.in_progress.equals(b.getStatus()))
                .count();

        long cancelled = bookings.stream()
                .filter(b -> BookingStatus.cancelled.equals(b.getStatus()))
                .count();

        long noShow = bookings.stream()
                .filter(b -> BookingStatus.no_show.equals(b.getStatus()))
                .count();

        BigDecimal revenue = bookings.stream()
                .filter(b -> BookingStatus.completed.equals(b.getStatus()))
                .map(this::calculateBookingTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return DashboardReportDTO.builder()
                .totalBookings(bookings.size())
                .completedBookings(completed)
                .pendingBookings(pending)
                .confirmedBookings(confirmed)
                .checkedInBookings(checkedIn)
                .inProgressBookings(inProgress)
                .cancelledBookings(cancelled)
                .noShowBookings(noShow)
                .totalCustomers(customerRepository.count())
                .totalBranches(branchRepository.count())
                .totalServices(servicePackageRepository.count())
                .revenue(revenue)
                .build();
    }

    private BigDecimal calculateBookingTotal(Booking booking) {
        List<BookingDetail> details = bookingDetailRepository.findByBooking(booking);

        return details.stream()
                .map(BookingDetail::getSubTotal)
                .filter(value -> value != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}