package com.autowash.backend.common.migration;

import com.autowash.backend.loyaltytier.service.LoyaltyTierEvaluationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

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

            seedWelcomeRewards();

            log.info("[Migration] Bắt đầu đánh giá lại hạng thành viên cho tất cả khách hàng...");
            loyaltyTierEvaluationService.evaluateAllCustomers();
            log.info("[Migration] Đánh giá lại hạng thành viên thành công.");
        } catch (Exception e) {
            log.error("[Migration] Đồng bộ/Đánh giá thất bại: {}", e.getMessage(), e);
        }
    }

    private void seedWelcomeRewards() {
        // Cập nhật lại các reward chào mừng cũ nếu lỡ seed giá trị thấp (5.00, 10.00, 15.00) lên giá trị chuẩn (50000.00, 100000.00, 150000.00)
        jdbcTemplate.update("UPDATE reward SET reward_value = 50000.00 WHERE required_tier_level = 2 AND reward_value = 5.00 AND reward_name LIKE '%chào mừng%'");
        jdbcTemplate.update("UPDATE reward SET reward_value = 100000.00 WHERE required_tier_level = 3 AND reward_value = 10.00 AND reward_name LIKE '%chào mừng%'");
        jdbcTemplate.update("UPDATE reward SET reward_value = 150000.00 WHERE required_tier_level = 4 AND reward_value = 15.00 AND reward_name LIKE '%chào mừng%'");

        // Cập nhật lại các voucher đã phát cho khách hàng để họ thấy giá trị mới ngay lập tức
        jdbcTemplate.update("UPDATE customer_reward SET discount_value = 50000.00 WHERE status = 'UNUSED' AND reward_id IN (SELECT reward_id FROM reward WHERE required_tier_level = 2 AND reward_value = 50000.00)");
        jdbcTemplate.update("UPDATE customer_reward SET discount_value = 100000.00 WHERE status = 'UNUSED' AND reward_id IN (SELECT reward_id FROM reward WHERE required_tier_level = 3 AND reward_value = 100000.00)");
        jdbcTemplate.update("UPDATE customer_reward SET discount_value = 150000.00 WHERE status = 'UNUSED' AND reward_id IN (SELECT reward_id FROM reward WHERE required_tier_level = 4 AND reward_value = 150000.00)");

        String sql = "INSERT INTO reward (reward_name, required_points, reward_type, reward_value, vehicle_type, status, required_tier_level, created_at) " +
                      "SELECT ?, 1, 'discount', ?, '4 chỗ', 'active', ?, NOW() " +
                     "WHERE NOT EXISTS (SELECT 1 FROM reward WHERE required_tier_level = ? AND reward_type = 'discount' AND reward_name LIKE '%chào mừng%')";

        int silver = jdbcTemplate.update(sql, "Voucher chào mừng hạng Bạc", BigDecimal.valueOf(50000.00), 2, 2);
        int gold = jdbcTemplate.update(sql, "Voucher chào mừng hạng Vàng", BigDecimal.valueOf(100000.00), 3, 3);
        int platinum = jdbcTemplate.update(sql, "Voucher chào mừng hạng Bạch Kim", BigDecimal.valueOf(150000.00), 4, 4);
        log.info("[Migration] Seed welcome rewards — Silver: {}, Gold: {}, Platinum: {}", silver, gold, platinum);
    }
}
