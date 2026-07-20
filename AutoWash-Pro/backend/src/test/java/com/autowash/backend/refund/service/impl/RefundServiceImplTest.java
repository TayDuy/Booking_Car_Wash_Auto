package com.autowash.backend.refund.service.impl;

import com.autowash.backend.booking.entity.Booking;
import com.autowash.backend.booking.enums.BookingStatus;
import com.autowash.backend.booking.repository.BookingRepository;
import com.autowash.backend.employee.entity.Employee;
import com.autowash.backend.employee.repository.EmployeeRepository;
import com.autowash.backend.notification.repository.NotificationRepository;
import com.autowash.backend.notification.service.SseService;
import com.autowash.backend.payment.entity.Payment;
import com.autowash.backend.payment.repository.PaymentRepository;
import com.autowash.backend.refund.dto.RefundDecisionDTO;
import com.autowash.backend.refund.dto.RefundResponseDTO;
import com.autowash.backend.refund.entity.Refund;
import com.autowash.backend.refund.mapper.RefundMapper;
import com.autowash.backend.refund.repository.RefundRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RefundServiceImplTest {

    @Mock
    private RefundRepository refundRepository;
    @Mock
    private PaymentRepository paymentRepository;
    @Mock
    private BookingRepository bookingRepository;
    @Mock
    private EmployeeRepository employeeRepository;
    @Mock
    private NotificationRepository notificationRepository;
    @Mock
    private SseService sseService;

    @Spy
    private RefundMapper refundMapper = new RefundMapper();

    @InjectMocks
    private RefundServiceImpl refundService;

    @Test
    void testApproveRefundSuccess() {
        Payment payment = Payment.builder()
                .paymentId(2)
                .paymentStatus(Payment.PaymentStatus.paid)
                .finalAmount(new BigDecimal("100000"))
                .build();

        Refund refund = Refund.builder()
                .refundId(2)
                .payment(payment)
                .amount(new BigDecimal("100000"))
                .reason("Khách hủy đặt lịch")
                .refundMethod(Refund.RefundMethod.cash)
                .status(Refund.RefundStatus.pending)
                .build();

        Employee admin = Employee.builder()
                .employeeId(1)
                .fullName("Admin Minh")
                .build();

        when(employeeRepository.findByUser_Id(1)).thenReturn(Optional.of(admin));
        when(refundRepository.findById(2)).thenReturn(Optional.of(refund));
        when(paymentRepository.findByIdForUpdate(2)).thenReturn(Optional.of(payment));
        when(refundRepository.save(any(Refund.class))).thenAnswer(i -> i.getArgument(0));

        RefundResponseDTO response = refundService.approve(2, new RefundDecisionDTO("Đã duyệt"), 1);

        assertNotNull(response);
        assertEquals(Refund.RefundStatus.approved, response.getStatus());
        verify(refundRepository, times(1)).save(any(Refund.class));
    }
}
