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

@Service
@RequiredArgsConstructor
public class ReportServiceImpl implements ReportService {

    private final BookingRepository bookingRepository;
    private final BookingDetailRepository bookingDetailRepository;
    private final CustomerRepository customerRepository;
    private final BranchRepository branchRepository;
    private final ServicePackageRepository servicePackageRepository;

    @Override
    public DashboardReportDTO getDashboardReport() {
        List<Booking> bookings = bookingRepository.findAll();

        long completed = bookings.stream()
                .filter(b -> BookingStatus.completed.equals(b.getStatus()))
                .count();

        long pending = bookings.stream()
                .filter(b -> BookingStatus.pending.equals(b.getStatus()))
                .count();

        long cancelled = bookings.stream()
                .filter(b -> BookingStatus.cancelled.equals(b.getStatus()))
                .count();

        BigDecimal revenue = bookings.stream()
                .filter(b -> BookingStatus.completed.equals(b.getStatus()))
                .map(this::calculateBookingTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return DashboardReportDTO.builder()
                .totalBookings(bookings.size())
                .completedBookings(completed)
                .pendingBookings(pending)
                .cancelledBookings(cancelled)
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