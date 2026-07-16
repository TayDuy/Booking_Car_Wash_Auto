package com.autowash.backend.payment.config;

import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Cấu hình kết nối PayPal REST API (Checkout Orders v2).
 * Toàn bộ giá trị được đọc từ application.properties / biến môi trường,
 * KHÔNG hard-code client id / secret trong code (khác với VNPayConfig cũ).
 *
 * Đăng ký app sandbox tại: https://developer.paypal.com/dashboard/applications
 */
@Getter
@Component
public class PayPalConfig {

    /** Client ID của app PayPal (sandbox hoặc live). */
    @Value("${app.paypal.client-id:}")
    private String clientId;

    /** Client Secret của app PayPal — KHÔNG lộ ra frontend. */
    @Value("${app.paypal.client-secret:}")
    private String clientSecret;

    /** "sandbox" khi test, "live" khi lên production. */
    @Value("${app.paypal.mode:sandbox}")
    private String mode;

    /** Đơn vị tiền tệ PayPal xử lý — mặc định USD vì PayPal không hỗ trợ trực tiếp VND. */
    @Value("${app.paypal.currency:USD}")
    private String currency;

    /** URL backend nhận khi khách approve thanh toán bên PayPal (PayPal redirect trình duyệt về đây). */
    @Value("${app.paypal.return-url:http://localhost:8080/api/v1/payments/paypal-return}")
    private String returnUrl;

    /** URL backend nhận khi khách bấm hủy/quay lại từ trang PayPal. */
    @Value("${app.paypal.cancel-url:http://localhost:8080/api/v1/payments/paypal-cancel}")
    private String cancelUrl;

    /** Base URL của PayPal REST API — sandbox hoặc live tùy theo cấu hình "mode". */
    public String getApiBaseUrl() {
        return "live".equalsIgnoreCase(mode)
                ? "https://api-m.paypal.com"
                : "https://api-m.sandbox.paypal.com";
    }
}