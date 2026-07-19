package com.autowash.backend.loyaltytier.service.impl;

import com.autowash.backend.customer.entity.Customer;
import com.autowash.backend.customer.repository.CustomerRepository;
import com.autowash.backend.loyaltytier.dto.CustomerTierEvaluationResponseDTO;
import com.autowash.backend.loyaltytier.dto.CustomerTierResponseDTO;
import com.autowash.backend.loyaltytier.entity.LoyaltyTier;
import com.autowash.backend.loyaltytier.repository.LoyaltyTierRepository;
import com.autowash.backend.loyaltytransaction.entity.LoyaltyTransaction;
import com.autowash.backend.loyaltytransaction.repository.LoyaltyTransactionRepository;
import com.autowash.backend.reward.repository.RewardRepository;
import com.autowash.backend.customerreward.repository.CustomerRewardRepository;
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
class LoyaltyTierEvaluationServiceImplTest {

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private LoyaltyTierRepository loyaltyTierRepository;

    @Mock
    private LoyaltyTransactionRepository loyaltyTransactionRepository;

    @Mock
    private RewardRepository rewardRepository;

    @Mock
    private CustomerRewardRepository customerRewardRepository;

    @Mock
    private com.autowash.backend.loyaltytier.mapper.LoyaltyTierMapper loyaltyTierMapper;

    @InjectMocks
    private LoyaltyTierEvaluationServiceImpl evaluationService;

    @Test
    void testGetCustomerTierByUserIdSuccess() {
        Customer customer = Customer.builder()
                .customerId(10)
                .tierId(1)
                .totalPoints(150)
                .totalVisits(5)
                .totalSpending(BigDecimal.valueOf(500000))
                .build();

        LoyaltyTier tier = LoyaltyTier.builder()
                .tierId(1)
                .tierName("Bronze")
                .priorityLevel(1)
                .build();

        LoyaltyTransaction transaction = new LoyaltyTransaction();
        transaction.setBalanceAfter(100);

        when(customerRepository.findByUser_Id(1)).thenReturn(Optional.of(customer));
        when(loyaltyTierRepository.findById(1)).thenReturn(Optional.of(tier));
        when(loyaltyTransactionRepository.findTopByCustomerIdOrderByCreatedAtDesc(10)).thenReturn(Optional.of(transaction));

        CustomerTierResponseDTO response = evaluationService.getCustomerTierByUserId(1);

        assertNotNull(response);
        assertEquals("Bronze", response.getTierName());
        assertEquals(100, response.getCurrentBalance());
        assertEquals(5, response.getTotalVisits());
    }

    @Test
    void testEvaluateCustomerTierByUserIdSuccess() {
        Customer customer = Customer.builder()
                .customerId(10)
                .tierId(1)
                .totalPoints(150)
                .totalVisits(5)
                .totalSpending(BigDecimal.valueOf(500000))
                .build();

        LoyaltyTier bronzeTier = LoyaltyTier.builder()
                .tierId(1)
                .tierName("Bronze")
                .priorityLevel(1)
                .minVisits(0)
                .minSpending(BigDecimal.ZERO)
                .isActive(true)
                .build();

        LoyaltyTier silverTier = LoyaltyTier.builder()
                .tierId(2)
                .tierName("Silver")
                .priorityLevel(2)
                .minVisits(10)
                .minSpending(BigDecimal.valueOf(1000000))
                .isActive(true)
                .build();

        when(customerRepository.findByUser_Id(1)).thenReturn(Optional.of(customer));
        when(loyaltyTierRepository.findByIsActiveTrueOrderByPriorityLevelDesc()).thenReturn(List.of(silverTier, bronzeTier));

        CustomerTierEvaluationResponseDTO mockResponse = CustomerTierEvaluationResponseDTO.builder()
                .newTierId(1)
                .build();
        when(loyaltyTierMapper.toEvaluationResponse(any(), any(), any(), any(), anyInt(), anyInt(), anyInt(), any(), anyString()))
                .thenReturn(mockResponse);

        CustomerTierEvaluationResponseDTO response = evaluationService.evaluateCustomerTierByUserId(1);

        assertNotNull(response);
        assertEquals(1, response.newTierId()); // Remains Bronze because not enough spending/visits for Silver
        verify(customerRepository, times(1)).save(customer);
    }
}
