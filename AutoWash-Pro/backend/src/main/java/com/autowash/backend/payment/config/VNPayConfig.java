package com.autowash.backend.payment.config;

import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
@Getter
public class VNPayConfig {

    @Value("${app.vnpay.pay-url}")
    private String vnp_PayUrl;

    @Value("${app.vnpay.return-url}")
    private String vnp_ReturnUrl;

    @Value("${app.vnpay.tmn-code}")
    private String vnp_TmnCode;

    @Value("${app.vnpay.hash-secret}")
    private String vnp_HashSecret;

    @Value("${app.vnpay.api-url}")
    private String vnp_ApiUrl;

    public static final String vnp_Version = "2.1.0";
    public static final String vnp_Command = "pay";
}