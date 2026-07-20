package com.autowash.backend.reward.service.impl;

import com.autowash.backend.customer.entity.Customer;
import com.autowash.backend.customer.repository.CustomerRepository;
import com.autowash.backend.customerreward.dto.CustomerRewardResponseDTO;
import com.autowash.backend.customerreward.service.CustomerRewardService;
import com.autowash.backend.reward.dto.RedeemRewardRequestDTO;
import com.autowash.backend.reward.dto.RedeemRewardResponseDTO;
import com.autowash.backend.reward.dto.RewardRequestDTO;
import com.autowash.backend.reward.dto.RewardResponseDTO;
import com.autowash.backend.reward.entity.Reward;
import com.autowash.backend.reward.mapper.RewardMapper;
import com.autowash.backend.reward.repository.RewardRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RewardServiceImplTest {

    @Mock
    private RewardRepository rewardRepository;

    @Mock
    private RewardMapper rewardMapper;

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private CustomerRewardService customerRewardService;

    @Mock
    private com.autowash.backend.user.repository.UserRepository userRepository;

    @InjectMocks
    private RewardServiceImpl rewardService;

    @Test
    void testCreateRewardSuccess() {
        RewardRequestDTO dto = new RewardRequestDTO();
        dto.setRewardName("Free Wash");
        dto.setRequiredPoints(50);

        Reward reward = Reward.builder()
                .rewardId(1)
                .rewardName("Free Wash")
                .requiredPoints(50)
                .build();

        when(rewardMapper.toEntity(dto)).thenReturn(reward);
        when(rewardRepository.save(reward)).thenReturn(reward);

        RewardResponseDTO mockResponse = new RewardResponseDTO();
        mockResponse.setRewardId(1);
        mockResponse.setRewardName("Free Wash");
        when(rewardMapper.toResponse(reward)).thenReturn(mockResponse);

        RewardResponseDTO response = rewardService.create(dto);

        assertNotNull(response);
        assertEquals(1, response.getRewardId());
        assertEquals("Free Wash", response.getRewardName());
    }

    @Test
    void testRedeemRewardSuccess() {
        RedeemRewardRequestDTO request = new RedeemRewardRequestDTO(10, "car");

        Customer customer = Customer.builder()
                .customerId(10)
                .build();

        Reward reward = Reward.builder()
                .rewardId(5)
                .rewardName("Voucher 50k")
                .requiredPoints(300)
                .build();

        when(rewardRepository.findById(5)).thenReturn(Optional.of(reward));

        com.autowash.backend.user.entity.User mockUser = com.autowash.backend.user.entity.User.builder()
                .id(12)
                .role("admin")
                .build();
        when(userRepository.findById(12)).thenReturn(Optional.of(mockUser));

        CustomerRewardResponseDTO crResponse = CustomerRewardResponseDTO.builder()
                .remainingPoints(100)
                .build();
        when(customerRewardService.redeemReward(10, 5, 12)).thenReturn(crResponse);

        RedeemRewardResponseDTO response = rewardService.redeemReward(5, request, 12);

        assertNotNull(response);
        assertEquals("Voucher 50k", response.rewardName());
        assertEquals(300, response.pointsUsed());
        assertEquals(100, response.balanceAfter());
    }
}
