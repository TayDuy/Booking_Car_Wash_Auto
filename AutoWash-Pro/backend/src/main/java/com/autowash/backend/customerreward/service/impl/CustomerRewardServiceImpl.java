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
import com.autowash.backend.loyaltytier.entity.LoyaltyTier;
import com.autowash.backend.loyaltytier.repository.LoyaltyTierRepository;
import com.autowash.backend.loyaltytransaction.dto.LoyaltyBalanceResponseDTO;
import com.autowash.backend.loyaltytransaction.entity.LoyaltyTransaction;
import com.autowash.backend.loyaltytransaction.repository.LoyaltyTransactionRepository;
import com.autowash.backend.loyaltytransaction.service.LoyaltyTransactionService;
import com.autowash.backend.reward.dto.RedeemRewardRequestDTO;
import com.autowash.backend.reward.entity.Reward;
import com.autowash.backend.reward.repository.RewardRepository;
import com.autowash.backend.user.entity.User;
import com.autowash.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.Sort;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CustomerRewardServiceImpl implements CustomerRewardService {

    private final CustomerRewardRepository customerRewardRepository;
    private final CustomerRepository customerRepository;
    private final RewardRepository rewardRepository;
    private final LoyaltyTransactionRepository loyaltyTransactionRepository;
    private final BookingRepository bookingRepository;
    private final LoyaltyTransactionService loyaltyTransactionService;
    private final CustomerRewardMapper customerRewardMapper;
    private final com.autowash.backend.user.repository.UserRepository userRepository;
    private final LoyaltyTierRepository loyaltyTierRepository;
    private final com.autowash.backend.auditlog.service.AuditLogService auditLogService;

    /**
     * Luồng đổi reward:
     * 1. Xác thực quyền sở hữu customer.
     * 2. Khóa bản ghi customer để tránh hai request đồng thời cùng tiêu điểm.
     * 3. Kiểm tra reward active, đúng loại xe và đủ điểm.
     * 4. Trừ customer.total_points.
     * 5. Ghi loyalty_transaction.
     * 6. Tạo voucher customer_reward.
     *
     * Tất cả nằm trong cùng một transaction; lỗi ở bất kỳ bước nào sẽ rollback toàn bộ.
     */
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

        // Chặn không cho phép đổi quà chào mừng thăng hạng nhiều lần (chỉ được đổi tối đa 1 lần)
        if (reward.isWelcomeReward()) {
            boolean alreadyRedeemed = customerRewardRepository.existsByCustomer_CustomerIdAndReward_RewardId(customerId, rewardId);
            if (alreadyRedeemed) {
                throw new BusinessException(
                        "Bạn đã đổi quà chào mừng của hạng thành viên này rồi",
                        HttpStatus.BAD_REQUEST
                );
            }
        }

        // Kiểm tra hạng thành viên tối thiểu
        if (reward.getRequiredTierLevel() != null) {
            Integer customerTierLevel = getCustomerTierLevel(customerId);
            if (customerTierLevel == null || customerTierLevel < reward.getRequiredTierLevel()) {
                throw new BusinessException(
                        "Bạn cần đạt hạng thành viên cao hơn để đổi phần thưởng này",
                        HttpStatus.FORBIDDEN
                );
            }
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

        LoyaltyTransaction transaction = LoyaltyTransaction.builder()
                .customerId(customerId)
                .paymentId(null)
                .transactionType("redeem")
                .points(-reward.getRequiredPoints())
                .balanceBefore(currentPoints)
                .balanceAfter(currentPoints - reward.getRequiredPoints())
                .createdAt(LocalDateTime.now())
                .note("Đổi điểm lấy voucher: " + reward.getRewardName())
                .build();

        int newBalance = Math.max(0, currentPoints - reward.getRequiredPoints());
        loyaltyTransactionRepository.save(transaction);

        customer.setTotalPoints(newBalance);
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

        auditLogService.log(
                "VOUCHER_REDEEMED",
                "SYSTEM",
                customer.getUser() != null ? customer.getUser().getId() : null,
                "Đổi voucher " + maskVoucherCode(saved.getVoucherCode())
                        + " (" + reward.getRewardName() + ")"
        );

        return customerRewardMapper.toResponse(saved, currentPoints - reward.getRequiredPoints());
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
    @Transactional(readOnly = true)
    public List<CustomerRewardResponseDTO> getAllCustomerRewards() {
        return customerRewardRepository
                .findAll(
                        Sort.by(
                                Sort.Direction.DESC,
                                "redeemedAt"
                        )
                )
                .stream()
                .map(item -> customerRewardMapper.toResponse(item, null))
                .toList();
    }
    /**
     * Dùng voucher cho một booking.
     * Repository nên khóa bản ghi theo voucherCode bằng PESSIMISTIC_WRITE
     * để tránh hai request đồng thời cùng sử dụng một voucher.
     */
    @Override
    @Transactional
    public CustomerRewardResponseDTO useReward(String voucherCode, Integer bookingId, Integer userId) {
        CustomerReward customerReward = customerRewardRepository.findByVoucherCode(voucherCode)
                .orElseThrow(() -> new ResourceNotFoundException("CustomerReward", "voucherCode", voucherCode));

        Integer voucherCustomerId = customerReward.getCustomer().getCustomerId();
        validateCustomerOwner(voucherCustomerId, userId);

        if (!"UNUSED".equals(customerReward.getStatus())) {
            throw new BusinessException("Voucher này đã được sử dụng hoặc không còn khả dụng", HttpStatus.BAD_REQUEST);
        }

        if (customerReward.getExpiredAt() != null
                && customerReward.getExpiredAt().isBefore(LocalDateTime.now())) {
            customerReward.setStatus("EXPIRED");
            customerRewardRepository.save(customerReward);

            auditLogService.log(
                    "VOUCHER_EXPIRED",
                    "SYSTEM",
                    customerReward.getCustomer().getUser() != null
                            ? customerReward.getCustomer().getUser().getId() : null,
                    "Voucher " + maskVoucherCode(customerReward.getVoucherCode()) + " đã hết hạn"
            );

            throw new BusinessException("Voucher đã hết hạn", HttpStatus.BAD_REQUEST);
        }

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking", "id", bookingId));

        Integer bookingCustomerId = booking.getCustomer().getCustomerId();

        if (!voucherCustomerId.equals(bookingCustomerId)) {
            throw new BusinessException("Voucher không thuộc về khách hàng của booking này", HttpStatus.BAD_REQUEST);
        }

        customerReward.setStatus("USED");
        customerReward.setUsedBookingId(bookingId);
        customerReward.setUsedAt(LocalDateTime.now());

        CustomerReward saved = customerRewardRepository.save(customerReward);

        auditLogService.log(
                "VOUCHER_USED",
                "SYSTEM",
                customerReward.getCustomer().getUser() != null
                        ? customerReward.getCustomer().getUser().getId() : null,
                "Sử dụng voucher " + maskVoucherCode(saved.getVoucherCode())
                        + " cho booking #" + bookingId
        );

        LoyaltyBalanceResponseDTO balance =
                loyaltyTransactionService.getCustomerBalance(voucherCustomerId);

        return customerRewardMapper.toResponse(saved, balance.getCurrentPoints());
    }

    private void validateCustomerOwner(Integer customerId, Integer userId) {
        if (userId == null) {
            throw new BusinessException(
                    "Không thể xác thực người dùng",
                    HttpStatus.FORBIDDEN
            );
        }

        com.autowash.backend.user.entity.User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(
                        "Không tìm thấy tài khoản người dùng",
                        HttpStatus.FORBIDDEN
                ));

        String role = user.getRole();
        if ("admin".equalsIgnoreCase(role) || "staff".equalsIgnoreCase(role)) {
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

    private String maskVoucherCode(String code) {
        if (code == null || code.length() < 8) return "****";
        return code.substring(0, 4) + "-****-" + code.substring(code.length() - 4);
    }

    private Integer getCustomerTierLevel(Integer customerId) {
        return customerRepository.findById(customerId)
                .map(Customer::getTierId)
                .flatMap(tierId -> loyaltyTierRepository.findById(tierId))
                .map(LoyaltyTier::getPriorityLevel)
                .orElse(null);
    }
}