package com.autowash.backend.common.migration;

import com.autowash.backend.loyaltytier.service.LoyaltyTierEvaluationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DatabaseMigrationRunner implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;
    private final LoyaltyTierEvaluationService loyaltyTierEvaluationService;

    @Override
    public void run(String... args) {
        log.info("[Migration] Bắt đầu đồng bộ total_visits cho khách hàng cũ...");
        try {
            // Tối ưu hóa câu lệnh SQL: dùng COUNT(DISTINCT b.booking_id) để tránh đếm trùng payment
            String sql = "UPDATE customer c " +
                         "SET total_visits = ( " +
                         "    SELECT COALESCE(COUNT(DISTINCT b.booking_id), 0) FROM payment p " +
                         "    JOIN booking b ON p.booking_id = b.booking_id " +
                         "    WHERE b.customer_id = c.customer_id " +
                         "    AND p.payment_status = 'paid' " +
                         ") " +
                         "WHERE c.total_visits IS NULL OR c.total_visits = 0";
            int rows = jdbcTemplate.update(sql);
            log.info("[Migration] Đồng bộ hoàn thành. Đã cập nhật total_visits cho {} khách hàng.", rows);

            // Chạy re-evaluation cho tất cả các khách hàng sau khi cập nhật dữ liệu lịch sử
            log.info("[Migration] Bắt đầu đánh giá lại hạng thành viên cho tất cả khách hàng...");
            loyaltyTierEvaluationService.evaluateAllCustomers();
            log.info("[Migration] Đánh giá lại hạng thành viên thành công.");
        } catch (Exception e) {
            log.error("[Migration] Đồng bộ/Đánh giá thất bại: {}", e.getMessage(), e);
        }
    }
}
