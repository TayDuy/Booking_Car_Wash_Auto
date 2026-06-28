package com.autowash.backend.promotion.scheduler;

import com.autowash.backend.promotion.service.PromotionService;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class PromotionScheduler {

    private final PromotionService promotionService;

    /**
     * Chạy mỗi ngày lúc 00:05 để chuyển promotion hết hạn sang expired.
     */
    @Scheduled(cron = "0 5 0 * * *")
    public void expirePromotionsDaily() {
        int expiredCount = promotionService.expireExpiredPromotions();

        if (expiredCount > 0) {
            System.out.println("Expired promotions updated: " + expiredCount);
        }
    }
}
