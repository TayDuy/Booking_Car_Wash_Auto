package com.autowash.backend.customerreward.service.impl;

import com.autowash.backend.booking.entity.Booking;
import com.autowash.backend.booking.repository.BookingRepository;
import com.autowash.backend.common.exception.BusinessException;
import com.autowash.backend.common.exception.ResourceNotFoundException;
import com.autowash.backend.customer.entity.Customer;
import com.autowash.backend.customer.repository.CustomerRepository;
import com.autowash.backend.customerreward.dto.CustomerRewardResponseDTO;
import com.autowash.backend.customerreward.entity.CustomerReward;
import com.autowash.backend.customerreward.mapper.CustomerRewardMapper;
import com.autowash.backend.customerreward.repository.CustomerRewardRepository;
import com.autowash.backend.customerreward.service.CustomerRewardService;
import com.autowash.backend.loyaltytransaction.dto.LoyaltyBalanceResponseDTO;
import com.autowash.backend.loyaltytransaction.entity.LoyaltyTransaction;
import com.autowash.backend.loyaltytransaction.repository.LoyaltyTransactionRepository;
import com.autowash.backend.loyaltytransaction.service.LoyaltyTransactionService;
import com.autowash.backend.reward.entity.Reward;
import com.autowash.backend.reward.repository.RewardRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CustomerRewardServiceImpl implements CustomerRewardService {

    private final CustomerRewardRepository customerRewardRepository;
    private final CustomerRepository customerRepository;
    private final RewardRepository rewardRepository;
    private final LoyaltyTransactionRepository loyaltyTransactionRepository;
    private final BookingRepository bookingRepository;
    private final LoyaltyTransactionService loyaltyTransactionService;
    private final CustomerRewardMapper customerRewardMapper;

    @Override
    @Transactional
    public CustomerRewardResponseDTO redeemReward(Integer customerId, Integer rewardId, Integer userId) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer", "id", customerId));

        validateCustomerOwner(customerId, userId);

        Reward reward = rewardRepository.findById(rewardId)
                .orElseThrow(() -> new ResourceNotFoundException("Reward", "id", rewardId));

        if (!Reward.RewardStatus.active.equals(reward.getStatus())) {
            throw new BusinessException(
                    "Phần thưởng này hiện không khả dụng",
                    HttpStatus.BAD_REQUEST
            );
        }

        LoyaltyBalanceResponseDTO balance =
                loyaltyTransactionService.getCustomerBalance(customerId);

        Integer currentPoints = balance.getCurrentPoints();

        if (currentPoints < reward.getRequiredPoints()) {
            throw new BusinessException(
                    "Không đủ điểm để đổi phần thưởng này",
                    HttpStatus.BAD_REQUEST
            );
        }

        Integer remainingPoints = currentPoints - reward.getRequiredPoints();

        LoyaltyTransaction transaction = LoyaltyTransaction.builder()
                .customerId(customerId)
                .paymentId(null)
                .transactionType("redeem")
                .points(-reward.getRequiredPoints())
                .balanceBefore(currentPoints)
                .balanceAfter(remainingPoints)
                .createdAt(LocalDateTime.now())
                .note("Đổi điểm lấy voucher: " + reward.getRewardName())
                .build();

        loyaltyTransactionRepository.save(transaction);

        customer.setTotalPoints(remainingPoints);
        customerRepository.save(customer);

        CustomerReward customerReward = CustomerReward.builder()
                .customer(customer)
                .reward(reward)
                .voucherCode(generateVoucherCode())
                .status("UNUSED")
                .redeemedPoints(reward.getRequiredPoints())
                .discountType(reward.getRewardType().name())
                .discountValue(reward.getRewardValue())
                .redeemedAt(LocalDateTime.now())
                .expiredAt(LocalDateTime.now().plusDays(30))
                .build();

        CustomerReward saved = customerRewardRepository.save(customerReward);

        return customerRewardMapper.toResponse(saved, remainingPoints);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CustomerRewardResponseDTO> getCustomerRewards(Integer customerId, Integer userId) {
        customerRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer", "id", customerId));

        validateCustomerOwner(customerId, userId);

        return customerRewardRepository
                .findByCustomer_CustomerIdOrderByRedeemedAtDesc(customerId)
                .stream()
                .map(item -> customerRewardMapper.toResponse(item, null))
                .toList();
    }

    @Override
    @Transactional
    public CustomerRewardResponseDTO useReward(String voucherCode, Integer bookingId, Integer userId) {
        CustomerReward customerReward = customerRewardRepository.findByVoucherCode(voucherCode)
                .orElseThrow(() -> new ResourceNotFoundException("CustomerReward", "voucherCode", voucherCode));

        if (!"UNUSED".equals(customerReward.getStatus())) {
            throw new BusinessException("Voucher này đã được sử dụng hoặc không còn khả dụng", HttpStatus.BAD_REQUEST);
        }

        if (customerReward.getExpiredAt() != null
                && customerReward.getExpiredAt().isBefore(LocalDateTime.now())) {
            customerReward.setStatus("EXPIRED");
            customerRewardRepository.save(customerReward);

            throw new BusinessException("Voucher đã hết hạn", HttpStatus.BAD_REQUEST);
        }

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking", "id", bookingId));

        Integer voucherCustomerId = customerReward.getCustomer().getCustomerId();
        Integer bookingCustomerId = booking.getCustomer().getCustomerId();

        if (!voucherCustomerId.equals(bookingCustomerId)) {
            throw new BusinessException("Voucher không thuộc về khách hàng của booking này", HttpStatus.BAD_REQUEST);
        }

        validateCustomerOwner(voucherCustomerId, userId);

        customerReward.setStatus("USED");
        customerReward.setUsedBookingId(bookingId);
        customerReward.setUsedAt(LocalDateTime.now());

        CustomerReward saved = customerRewardRepository.save(customerReward);

        LoyaltyBalanceResponseDTO balance =
                loyaltyTransactionService.getCustomerBalance(voucherCustomerId);

        return customerRewardMapper.toResponse(saved, balance.getCurrentPoints());
    }

    private void validateCustomerOwner(Integer customerId, Integer userId) {
        if (userId == null) {
            return;
        }

        Customer authenticatedCustomer = customerRepository.findByUser_Id(userId)
                .orElseThrow(() -> new BusinessException(
                        "Không tìm thấy khách hàng ứng với tài khoản đăng nhập",
                        HttpStatus.FORBIDDEN
                ));

        if (!authenticatedCustomer.getCustomerId().equals(customerId)) {
            throw new BusinessException(
                    "Bạn không có quyền thao tác với dữ liệu của khách hàng khác",
                    HttpStatus.FORBIDDEN
            );
        }
    }

    private String generateVoucherCode() {
        String random = UUID.randomUUID()
                .toString()
                .replace("-", "")
                .substring(0, 8)
                .toUpperCase();

        return "VW-" + random;
    }
}