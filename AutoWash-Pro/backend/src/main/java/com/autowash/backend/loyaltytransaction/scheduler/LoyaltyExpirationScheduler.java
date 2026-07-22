package com.autowash.backend.loyaltytransaction.scheduler;

import com.autowash.backend.auditlog.service.AuditLogService;
import com.autowash.backend.customer.entity.Customer;
import com.autowash.backend.customer.repository.CustomerRepository;
import com.autowash.backend.loyaltytransaction.entity.LoyaltyTransaction;
import com.autowash.backend.loyaltytransaction.repository.LoyaltyTransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class LoyaltyExpirationScheduler {

    private final LoyaltyTransactionRepository loyaltyTransactionRepository;
    private final CustomerRepository customerRepository;
    private final AuditLogService auditLogService;

    /**
     * Tự động quét và xử lý các giao dịch tích điểm ('earn') đã hết hạn (expired_at <= NOW()).
     * Chạy định kỳ mỗi 12 tiếng (fixedDelay = 43200000 ms).
     */
    @Scheduled(fixedDelay = 43200000)
    @Transactional
    public void processExpiredLoyaltyPoints() {
        try {
            LocalDateTime now = LocalDateTime.now();
            List<LoyaltyTransaction> expiredEarnTransactions =
                    loyaltyTransactionRepository.findByTransactionTypeAndExpiredAtBefore("earn", now);

            if (expiredEarnTransactions.isEmpty()) {
                return;
            }

            int processedCount = 0;
            for (LoyaltyTransaction earnTx : expiredEarnTransactions) {
                String idempotencyNote = "Hết hạn điểm từ giao dịch #" + earnTx.getLoyaltyTransactionId();

                // IDEMPOTENCY GUARD: Kiểm tra xem giao dịch hết hạn này đã được xử lý chưa
                List<LoyaltyTransaction> existingExpirations =
                        loyaltyTransactionRepository.findByCustomerIdAndTransactionType(earnTx.getCustomerId(), "expired");
                boolean alreadyProcessed = existingExpirations.stream()
                        .anyMatch(tx -> tx.getNote() != null && tx.getNote().equals(idempotencyNote));

                if (alreadyProcessed) {
                    continue;
                }

                Customer customer = customerRepository.findById(earnTx.getCustomerId()).orElse(null);
                if (customer == null) {
                    continue;
                }

                int pointsToExpire = earnTx.getPoints();
                if (pointsToExpire <= 0) {
                    continue;
                }

                int currentBalance = loyaltyTransactionRepository
                        .findTopByCustomerIdOrderByCreatedAtDesc(customer.getCustomerId())
                        .map(LoyaltyTransaction::getBalanceAfter)
                        .orElse(0);

                int newPoints = Math.max(0, customer.getTotalPoints() - pointsToExpire);
                customer.setTotalPoints(newPoints);
                customerRepository.save(customer);

                int balanceAfter = Math.max(0, currentBalance - pointsToExpire);

                LoyaltyTransaction expiredTx = LoyaltyTransaction.builder()
                        .customerId(customer.getCustomerId())
                        .paymentId(earnTx.getPaymentId())
                        .transactionType("expired")
                        .points(-pointsToExpire)
                        .balanceBefore(currentBalance)
                        .balanceAfter(balanceAfter)
                        .createdAt(now)
                        .note(idempotencyNote)
                        .build();

                loyaltyTransactionRepository.save(expiredTx);
                processedCount++;

                Integer targetUserId = customer.getUser() != null ? customer.getUser().getId() : null;
                if (targetUserId != null) {
                    auditLogService.log(
                            "POINTS_EXPIRED",
                            "SYSTEM",
                            targetUserId,
                            "Hết hạn " + pointsToExpire + " điểm thưởng từ giao dịch tích điểm #" + earnTx.getLoyaltyTransactionId()
                    );
                }
            }

            if (processedCount > 0) {
                log.info("[LoyaltyExpiration] Đã xử lý trừ điểm hết hạn thành công cho {} giao dịch.", processedCount);
            }
        } catch (Exception e) {
            log.error("[LoyaltyExpiration] Lỗi khi xử lý trừ điểm thưởng hết hạn: {}", e.getMessage(), e);
        }
    }
}
