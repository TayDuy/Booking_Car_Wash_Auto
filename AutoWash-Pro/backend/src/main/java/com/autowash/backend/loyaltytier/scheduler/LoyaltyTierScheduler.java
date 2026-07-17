package com.autowash.backend.loyaltytier.scheduler;

import com.autowash.backend.loyaltytier.service.LoyaltyTierEvaluationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
@Slf4j
public class LoyaltyTierScheduler {

    private final LoyaltyTierEvaluationService evaluationService;

    /**
     * Tự động quét và đánh giá lại hạng cho toàn bộ khách hàng vào lúc 2h sáng ngày mùng 1 hàng tháng.
     */
    @Scheduled(cron = "0 0 2 1 * ?")
    @Transactional
    public void monthlyTierEvaluation() {
        log.info("[LoyaltyTierScheduler] Bắt đầu đánh giá hạng thành viên hàng tháng cho tất cả khách hàng...");
        try {
            evaluationService.evaluateAllCustomers();
            log.info("[LoyaltyTierScheduler] Đánh giá hạng thành viên hoàn tất.");
        } catch (Exception e) {
            log.error("[LoyaltyTierScheduler] Đánh giá hạng thành viên định kỳ thất bại: {}", e.getMessage(), e);
        }
    }
}
