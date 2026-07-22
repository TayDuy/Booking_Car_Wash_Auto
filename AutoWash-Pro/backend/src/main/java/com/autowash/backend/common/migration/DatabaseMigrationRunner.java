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

            // BR-24 -> 27: Cập nhật booking_window_days cho các hạng thành viên (Member 7d, Silver 10d, Gold 14d, Platinum 30d)
            jdbcTemplate.update("UPDATE loyalty_tier SET booking_window_days = 7 WHERE tier_id = 1 OR LOWER(tier_name) LIKE '%member%' OR LOWER(tier_name) LIKE '%đồng%'");
            jdbcTemplate.update("UPDATE loyalty_tier SET booking_window_days = 10 WHERE tier_id = 2 OR LOWER(tier_name) LIKE '%bạc%' OR LOWER(tier_name) LIKE '%silver%'");
            jdbcTemplate.update("UPDATE loyalty_tier SET booking_window_days = 14 WHERE tier_id = 3 OR LOWER(tier_name) LIKE '%vàng%' OR LOWER(tier_name) LIKE '%gold%'");
            jdbcTemplate.update("UPDATE loyalty_tier SET booking_window_days = 30 WHERE tier_id = 4 OR LOWER(tier_name) LIKE '%bạch kim%' OR LOWER(tier_name) LIKE '%platinum%'");

            seedTestUser10Bookings();
            cleanupExpiredPastBookings();

            log.info("[Migration] Bắt đầu đánh giá lại hạng thành viên cho tất cả khách hàng...");
            loyaltyTierEvaluationService.evaluateAllCustomers();
            log.info("[Migration] Đánh giá lại hạng thành viên thành công.");
        } catch (Exception e) {
            log.error("[Migration] Đồng bộ/Đánh giá thất bại: {}", e.getMessage(), e);
        }
    }

    private void seedTestUser10Bookings() {
        try {
            String email = "01q6kkoin0@yzcalo.com";
            // 1. Cập nhật các booking hiện có của user sang 'completed'
            jdbcTemplate.update("""
                UPDATE booking 
                SET status = 'completed' 
                WHERE customer_id IN (
                    SELECT c.customer_id FROM customer c 
                    JOIN account a ON c.user_id = a.user_id 
                    WHERE a.email = ?
                )
            """, email);

            // 2. Cập nhật payment tương ứng sang 'paid'
            jdbcTemplate.update("""
                UPDATE payment 
                SET payment_status = 'paid' 
                WHERE booking_id IN (
                    SELECT b.booking_id FROM booking b 
                    JOIN customer c ON b.customer_id = c.customer_id 
                    JOIN account a ON c.user_id = a.user_id 
                    WHERE a.email = ?
                )
            """, email);

            // 3. Đếm số booking hiện có của user
            Integer currentCount = jdbcTemplate.queryForObject("""
                SELECT COUNT(*) FROM booking b 
                JOIN customer c ON b.customer_id = c.customer_id 
                JOIN account a ON c.user_id = a.user_id 
                WHERE a.email = ?
            """, Integer.class, email);

            Integer customerId = jdbcTemplate.queryForObject("""
                SELECT c.customer_id FROM customer c 
                JOIN account a ON c.user_id = a.user_id 
                WHERE a.email = ?
            """, Integer.class, email);

            if (customerId != null && currentCount != null && currentCount < 10) {
                Integer branchId = jdbcTemplate.queryForObject("SELECT branch_id FROM branch LIMIT 1", Integer.class);
                Integer timeSlotId = jdbcTemplate.queryForObject("SELECT slot_id FROM time_slot LIMIT 1", Integer.class);
                
                var vehicles = jdbcTemplate.queryForList("SELECT vehicle_id FROM vehicle WHERE customer_id = ?", Integer.class, customerId);
                Integer vehicleId = !vehicles.isEmpty() ? vehicles.get(0) : jdbcTemplate.queryForObject("SELECT vehicle_id FROM vehicle LIMIT 1", Integer.class);

                int needed = 10 - currentCount;
                for (int i = 1; i <= needed; i++) {
                    String bookingCode = "BK-SEED-" + String.format("%05d", (int)(Math.random() * 100000));
                    Integer bookingId = jdbcTemplate.queryForObject("""
                        INSERT INTO booking (booking_code, customer_id, branch_id, vehicle_id, slot_id, booking_date, status, priority_score, total_amount, final_amount, created_at, updated_at)
                        VALUES (?, ?, ?, ?, ?, CURRENT_DATE - INTERVAL '1 day' * ?, 'completed', 1, 300000.00, 300000.00, NOW(), NOW())
                        RETURNING booking_id
                    """, Integer.class, bookingCode, customerId, branchId, vehicleId, timeSlotId, i);

                    jdbcTemplate.update("""
                        INSERT INTO payment (booking_id, payment_method, payment_status, total_amount, final_amount, created_at)
                        VALUES (?, 'Cash', 'paid', 300000.00, 300000.00, NOW())
                    """, bookingId);
                }
            }

            // Đồng bộ lại total_visits và total_spending cho customer này
            jdbcTemplate.update("""
                UPDATE customer c
                SET total_visits = (
                    SELECT COUNT(*) FROM booking b WHERE b.customer_id = c.customer_id AND b.status = 'completed'
                ),
                total_spending = (
                    SELECT COALESCE(SUM(p.final_amount), 0) FROM payment p JOIN booking b ON p.booking_id = b.booking_id WHERE b.customer_id = c.customer_id AND p.payment_status = 'paid'
                )
                WHERE c.user_id IN (SELECT user_id FROM account WHERE email = ?)
            """, email);

            log.info("[Migration] Seeded 10 completed bookings for user {}", email);
        } catch (Exception e) {
            log.error("[Migration] Lỗi seed 10 bookings cho test user: {}", e.getMessage(), e);
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

    private void cleanupExpiredPastBookings() {
        try {
            int cancelledUnpaid = jdbcTemplate.update("""
                UPDATE booking b
                SET status = 'cancelled', updated_at = NOW()
                FROM time_slot ts, payment p
                WHERE b.slot_id = ts.slot_id
                AND b.booking_id = p.booking_id
                AND b.status IN ('pending', 'confirmed')
                AND p.payment_status <> 'paid'
                AND ts.slot_date < CURRENT_DATE
            """);

            int noShowPaid = jdbcTemplate.update("""
                UPDATE booking b
                SET status = 'no_show', updated_at = NOW()
                FROM time_slot ts, payment p
                WHERE b.slot_id = ts.slot_id
                AND b.booking_id = p.booking_id
                AND b.status IN ('pending', 'confirmed')
                AND p.payment_status = 'paid'
                AND ts.slot_date < CURRENT_DATE
            """);

            int cancelledOthers = jdbcTemplate.update("""
                UPDATE booking b
                SET status = 'cancelled', updated_at = NOW()
                FROM time_slot ts
                WHERE b.slot_id = ts.slot_id
                AND b.status IN ('pending', 'confirmed')
                AND ts.slot_date < CURRENT_DATE
            """);

            log.info("[Migration] Dọn dẹp booking quá hạn: Hủy {} đơn chưa thanh toán, chuyển {} đơn sang no-show, dọn {} đơn khác.",
                    cancelledUnpaid, noShowPaid, cancelledOthers);
        } catch (Exception e) {
            log.error("[Migration] Lỗi dọn dẹp booking quá hạn: {}", e.getMessage(), e);
        }
    }
}
