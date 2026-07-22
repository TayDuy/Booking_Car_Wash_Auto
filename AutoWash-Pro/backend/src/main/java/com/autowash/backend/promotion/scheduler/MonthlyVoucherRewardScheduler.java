package com.autowash.backend.promotion.scheduler;

import com.autowash.backend.booking.entity.Booking;
import com.autowash.backend.booking.enums.BookingStatus;
import com.autowash.backend.booking.repository.BookingRepository;
import com.autowash.backend.customer.entity.Customer;
import com.autowash.backend.customerreward.entity.CustomerReward;
import com.autowash.backend.customerreward.repository.CustomerRewardRepository;
import com.autowash.backend.notification.dto.NotificationCreateDTO;
import com.autowash.backend.notification.entity.Notification;
import com.autowash.backend.notification.service.NotificationService;
import com.autowash.backend.reward.entity.Reward;
import com.autowash.backend.reward.repository.RewardRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * BR-40: Monthly Voucher Reward Scheduler.
 * Runs at 01:00 AM on the 1st of every month.
 * Scans customers with >= 5 COMPLETED bookings in the previous month and awards a special voucher.
 * Implements Idempotency to prevent duplicate voucher issuance.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class MonthlyVoucherRewardScheduler {

    private final BookingRepository bookingRepository;
    private final RewardRepository rewardRepository;
    private final CustomerRewardRepository customerRewardRepository;
    private final NotificationService notificationService;

    /**
     * Runs at 01:00 AM on the 1st of every month
     */
    @Scheduled(cron = "0 0 1 1 * ?")
    public void evaluateMonthlyLoyaltyVouchers() {
        log.info("Starting BR-40 Monthly Voucher Reward Evaluation...");
        YearMonth previousMonth = YearMonth.now().minusMonths(1);
        LocalDateTime fromDate = previousMonth.atDay(1).atStartOfDay();
        LocalDateTime toDate = previousMonth.atEndOfMonth().atTime(23, 59, 59);

        String monthCode = previousMonth.toString(); // e.g. "2026-06"

        try {
            // Find all COMPLETED bookings in the previous month
            List<Booking> completedBookings = bookingRepository.findByBookingDateGreaterThanEqualAndBookingDateLessThan(fromDate, toDate)
                    .stream()
                    .filter(b -> b.getStatus() == BookingStatus.completed)
                    .toList();

            Map<Customer, Long> countByCustomer = completedBookings.stream()
                    .collect(Collectors.groupingBy(Booking::getCustomer, Collectors.counting()));

            int rewardedCount = 0;
            for (Map.Entry<Customer, Long> entry : countByCustomer.entrySet()) {
                Customer customer = entry.getKey();
                Long washCount = entry.getValue();

                if (washCount >= 5) {
                    boolean alreadyAwarded = checkAlreadyAwarded(customer, monthCode);
                    if (!alreadyAwarded) {
                        issueMonthlyVoucher(customer, monthCode, washCount);
                        rewardedCount++;
                    }
                }
            }
            log.info("BR-40 Monthly Voucher Evaluation completed: {} customers rewarded for {}", rewardedCount, monthCode);
        } catch (Exception e) {
            log.error("Failed to evaluate monthly vouchers for BR-40: {}", e.getMessage(), e);
        }
    }

    private boolean checkAlreadyAwarded(Customer customer, String monthCode) {
        List<CustomerReward> rewards = customerRewardRepository.findByCustomer_CustomerIdOrderByRedeemedAtDesc(customer.getCustomerId());
        return rewards.stream()
                .anyMatch(cr -> cr.getReward() != null && cr.getReward().getRewardName() != null && cr.getReward().getRewardName().contains(monthCode));
    }

    private void issueMonthlyVoucher(Customer customer, String monthCode, Long washCount) {
        String rewardName = "Voucher Tri Ân Khách Hàng Thân Thiết (" + monthCode + ")";
        Reward reward = rewardRepository.findAll().stream()
                .filter(r -> rewardName.equals(r.getRewardName()))
                .findFirst()
                .orElseGet(() -> rewardRepository.save(
                        Reward.builder()
                                .rewardName(rewardName)
                                .requiredPoints(1)
                                .rewardType(Reward.RewardType.discount)
                                .rewardValue(new BigDecimal("10.00"))
                                .status(Reward.RewardStatus.active)
                                .requiredTierLevel(1)
                                .build()
                ));

        CustomerReward customerReward = CustomerReward.builder()
                .customer(customer)
                .reward(reward)
                .voucherCode("TRIAN-" + monthCode.replace("-", "") + "-" + UUID.randomUUID().toString().substring(0, 4).toUpperCase())
                .redeemedPoints(0)
                .status("UNUSED")
                .discountType("PERCENTAGE")
                .discountValue(new BigDecimal("10.00"))
                .expiredAt(LocalDateTime.now().plusDays(30))
                .build();

        customerRewardRepository.save(customerReward);

        if (customer.getUser() != null) {
            try {
                NotificationCreateDTO notificationDTO = NotificationCreateDTO.builder()
                        .userId(customer.getUser().getId())
                        .title("🎁 Quà tặng Tri Ân Tháng " + monthCode + "!")
                        .body("Bạn đã hoàn thành " + washCount + " lần rửa xe trong tháng " + monthCode + ". AutoWash gửi tặng bạn Voucher giảm giá 10% cho tháng mới!")
                        .type(Notification.NotificationType.TIER_UPGRADED)
                        .build();
                notificationService.create(notificationDTO);
            } catch (Exception e) {
                log.warn("Could not send monthly voucher notification to userId={}: {}", customer.getUser().getId(), e.getMessage());
            }
        }
    }
}
