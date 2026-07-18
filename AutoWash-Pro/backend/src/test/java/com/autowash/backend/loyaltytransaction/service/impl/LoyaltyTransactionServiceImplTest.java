package com.autowash.backend.loyaltytransaction.service.impl;

import com.autowash.backend.booking.entity.Booking;
import com.autowash.backend.customer.entity.Customer;
import com.autowash.backend.customer.repository.CustomerRepository;
import com.autowash.backend.loyaltytransaction.dto.LoyaltyBalanceResponseDTO;
import com.autowash.backend.loyaltytransaction.dto.LoyaltyTransactionResponseDTO;
import com.autowash.backend.loyaltytransaction.entity.LoyaltyTransaction;
import com.autowash.backend.loyaltytransaction.mapper.LoyaltyTransactionMapper;
import com.autowash.backend.loyaltytransaction.repository.LoyaltyTransactionRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LoyaltyTransactionServiceImplTest {

    @Mock
    private LoyaltyTransactionRepository loyaltyTransactionRepository;

    @Mock
    private LoyaltyTransactionMapper loyaltyTransactionMapper;

    @Mock
    private CustomerRepository customerRepository;

    @InjectMocks
    private LoyaltyTransactionServiceImpl loyaltyTransactionService;

    @Test
    void testEarnPointsFromCompleteBookingSuccess() {
        Customer customer = Customer.builder()
                .customerId(10)
                .build();

        Booking booking = Booking.builder()
                .bookingId(1)
                .bookingCode("BK-123456")
                .customer(customer)
                .build();

        when(loyaltyTransactionRepository.findTopByCustomerIdOrderByCreatedAtDesc(10)).thenReturn(Optional.empty());

        LoyaltyTransaction savedTx = new LoyaltyTransaction();
        when(loyaltyTransactionRepository.save(any(LoyaltyTransaction.class))).thenReturn(savedTx);

        LoyaltyTransactionResponseDTO mockResponse = new LoyaltyTransactionResponseDTO();
        mockResponse.setPoints(100);
        mockResponse.setTransactionType("earn");
        when(loyaltyTransactionMapper.toResponse(any())).thenReturn(mockResponse);

        LoyaltyTransactionResponseDTO response = loyaltyTransactionService.earnPointsFromCompleteBooking(booking, BigDecimal.valueOf(100000));

        assertNotNull(response);
        assertEquals(100, response.getPoints());
        verify(loyaltyTransactionRepository, times(1)).save(any());
    }

    @Test
    void testGetCustomerBalanceSuccess() {
        Customer customer = Customer.builder()
                .customerId(10)
                .totalPoints(300)
                .build();

        LoyaltyTransaction lastTx = new LoyaltyTransaction();
        lastTx.setBalanceAfter(150);

        when(loyaltyTransactionRepository.findTopByCustomerIdOrderByCreatedAtDesc(10)).thenReturn(Optional.of(lastTx));

        LoyaltyBalanceResponseDTO response = loyaltyTransactionService.getCustomerBalance(10);

        assertNotNull(response);
        assertEquals(150, response.getCurrentPoints());
    }
}
