package com.autowash.backend.payment.service.impl;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Map;

/**
 * Lấy tỉ giá VND/USD để quy đổi số tiền trước khi gửi cho PayPal
 * (PayPal không xử lý trực tiếp VND cho phần lớn tài khoản merchant).
 *
 * Gọi API tỉ giá miễn phí (open.er-api.com), cache lại 30 phút để tránh gọi
 * quá nhiều; nếu API lỗi/không truy cập được thì dùng tỉ giá fallback cố định.
 */
@Slf4j
@Service
public class ExchangeRateService {

    private static final String RATE_API_URL = "https://open.er-api.com/v6/latest/USD";

    // Tỉ giá dự phòng khi không gọi được API — cập nhật định kỳ cho gần thực tế.
    private static final BigDecimal FALLBACK_VND_PER_USD = BigDecimal.valueOf(26000);

    private static final long CACHE_TTL_MS = 30 * 60 * 1000L; // 30 phút

    private final RestTemplate restTemplate = new RestTemplate();

    private volatile BigDecimal cachedRate;
    private volatile long cachedAt = 0L;

    /**
     * Trả về số VND tương đương 1 USD tại thời điểm hiện tại (có cache).
     */
    public BigDecimal getVndPerUsd() {
        long now = System.currentTimeMillis();
        if (cachedRate != null && (now - cachedAt) < CACHE_TTL_MS) {
            return cachedRate;
        }

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.getForObject(RATE_API_URL, Map.class);

            if (response == null || !"success".equalsIgnoreCase(String.valueOf(response.get("result")))) {
                throw new IllegalStateException("Phản hồi tỉ giá không hợp lệ");
            }

            @SuppressWarnings("unchecked")
            Map<String, Object> rates = (Map<String, Object>) response.get("rates");
            Object vndValue = rates.get("VND");
            if (vndValue == null) {
                throw new IllegalStateException("Không tìm thấy tỉ giá VND trong phản hồi");
            }

            BigDecimal rate = new BigDecimal(String.valueOf(vndValue));
            cachedRate = rate;
            cachedAt = now;
            log.info("Đã cập nhật tỉ giá VND/USD: {}", rate);
            return rate;
        } catch (Exception e) {
            log.warn("Không lấy được tỉ giá VND/USD ({}). Dùng tỉ giá fallback = {}",
                    e.getMessage(), FALLBACK_VND_PER_USD);
            return cachedRate != null ? cachedRate : FALLBACK_VND_PER_USD;
        }
    }

    /**
     * Quy đổi số tiền VND sang USD, làm tròn 2 chữ số thập phân (yêu cầu của PayPal).
     */
    public BigDecimal convertVndToUsd(BigDecimal vndAmount) {
        BigDecimal rate = getVndPerUsd();
        BigDecimal usd = vndAmount.divide(rate, 2, RoundingMode.HALF_UP);
        // PayPal yêu cầu số tiền tối thiểu > 0
        return usd.compareTo(BigDecimal.ZERO) > 0 ? usd : new BigDecimal("0.01");
    }
}