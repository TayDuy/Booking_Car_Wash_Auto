package com.autowash.backend.common.migration;

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
        } catch (Exception e) {
            log.error("[Migration] Đồng bộ thất bại: {}", e.getMessage(), e);
        }
    }
}
