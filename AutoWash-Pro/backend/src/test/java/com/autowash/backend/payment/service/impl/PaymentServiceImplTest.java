package com.autowash.backend.payment.service.impl;

import com.autowash.backend.booking.entity.Booking;
import com.autowash.backend.booking.enums.BookingStatus;
import com.autowash.backend.booking.repository.BookingRepository;
import com.autowash.backend.booking.service.BookingDetailService;
import com.autowash.backend.customer.entity.Customer;
import com.autowash.backend.common.exception.BusinessException;
import com.autowash.backend.payment.dto.PaymentCreateRequestDTO;
import com.autowash.backend.payment.dto.PaymentResponseDTO;
import com.autowash.backend.payment.entity.Payment;
import com.autowash.backend.payment.mapper.PaymentMapper;
import com.autowash.backend.payment.repository.PaymentRepository;
import com.autowash.backend.promotion.repository.PromotionRepository;
import com.autowash.backend.promotion.repository.PromotionUseRepository;
import com.autowash.backend.customerreward.repository.CustomerRewardRepository;
import com.autowash.backend.vehicle.entity.Vehicle;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PaymentServiceImplTest {

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private BookingDetailService bookingDetailService;

    @Mock
    private PaymentMapper paymentMapper;

    @Mock
    private PromotionRepository promotionRepository;

    @Mock
    private PromotionUseRepository promotionUseRepository;

    @Mock
    private CustomerRewardRepository customerRewardRepository;

    @InjectMocks
    private PaymentServiceImpl paymentService;

    @Test
    void testCreatePaymentSuccess() {
        PaymentCreateRequestDTO request = new PaymentCreateRequestDTO();
        request.setBookingId(1);
        request.setPaymentMethod(Payment.PaymentMethod.cash);

        Customer customer = Customer.builder()
                .customerId(10)
                .build();

        Vehicle vehicle = Vehicle.builder()
                .vehicleType(Vehicle.VehicleType.car)
                .build();

        Booking booking = Booking.builder()
                .bookingId(1)
                .status(BookingStatus.confirmed)
                .customer(customer)
                .vehicle(vehicle)
                .build();

        when(bookingRepository.findByIdWithAssociations(1)).thenReturn(Optional.of(booking));
        when(paymentRepository.findByBooking_BookingId(1)).thenReturn(Optional.empty());
        when(bookingDetailService.calculateTotalAmount(1)).thenReturn(BigDecimal.valueOf(100000));
        when(promotionRepository.findAll()).thenReturn(Collections.emptyList());

        Payment savedPayment = new Payment();
        when(paymentRepository.save(any(Payment.class))).thenReturn(savedPayment);

        PaymentResponseDTO mockResponse = PaymentResponseDTO.builder()
                .paymentStatus(Payment.PaymentStatus.unpaid)
                .build();
        when(paymentMapper.toResponse(any())).thenReturn(mockResponse);

        PaymentResponseDTO response = paymentService.createPayment(request);

        assertNotNull(response);
        assertEquals(Payment.PaymentStatus.unpaid, response.getPaymentStatus());
        verify(paymentRepository, times(1)).save(any());
    }

    @Test
    void testCreatePaymentCancelledBookingThrowsException() {
        PaymentCreateRequestDTO request = new PaymentCreateRequestDTO();
        request.setBookingId(1);

        Booking booking = Booking.builder()
                .bookingId(1)
                .status(BookingStatus.cancelled)
                .build();

        when(bookingRepository.findByIdWithAssociations(1)).thenReturn(Optional.of(booking));

        assertThrows(BusinessException.class, () -> paymentService.createPayment(request));
    }
}
