package com.autowash.backend.payment.config;

import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

/**
 * Cấu hình các thông số kết nối VNPAY Sandbox từ application.properties.
 */
@Configuration
@Getter
public class VNPayConfig {

    @Value("${app.vnpay.pay-url}")
    private String payUrl;

    @Value("${app.vnpay.return-url}")
    private String returnUrl;

    @Value("${app.vnpay.tmn-code}")
    private String tmnCode;

    @Value("${app.vnpay.hash-secret}")
    private String hashSecret;

    @Value("${app.vnpay.api-url}")
    private String apiUrl;

    public static final String vnp_Version = "2.1.0";
    public static final String vnp_Command = "pay";
}