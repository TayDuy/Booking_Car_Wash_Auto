package com.autowash.backend.payment.service.impl;

import com.autowash.backend.common.exception.BusinessException;
import com.autowash.backend.payment.config.PayPalConfig;
import com.autowash.backend.payment.service.PayPalService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.json.JsonMapper;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class PayPalServiceImpl implements PayPalService {

    private final PayPalConfig paypalConfig;
    private final ExchangeRateService exchangeRateService;
    private final HttpServletRequest request;

    private final RestTemplate restTemplate = new RestTemplate();
    private final JsonMapper objectMapper = JsonMapper.builder().build();

    // ── OAuth2 — lấy access token dùng chung cho các API v2 ──────────────────

    private String fetchAccessToken() {
        if (paypalConfig.getClientId() == null || paypalConfig.getClientId().isBlank()
                || paypalConfig.getClientSecret() == null || paypalConfig.getClientSecret().isBlank()) {
            throw new BusinessException("PayPal chưa được cấu hình (thiếu client-id/client-secret)");
        }

        String url = paypalConfig.getApiBaseUrl() + "/v1/oauth2/token";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        String credentials = paypalConfig.getClientId() + ":" + paypalConfig.getClientSecret();
        String encoded = Base64.getEncoder().encodeToString(credentials.getBytes(StandardCharsets.UTF_8));
        headers.set(HttpHeaders.AUTHORIZATION, "Basic " + encoded);

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("grant_type", "client_credentials");

        HttpEntity<MultiValueMap<String, String>> entity = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);
            JsonNode json = objectMapper.readTree(response.getBody());
            return json.get("access_token").asText();
        } catch (Exception e) {
            log.error("Lỗi lấy access token PayPal: {}", e.getMessage());
            throw new BusinessException("Không kết nối được với PayPal (OAuth2 token)");
        }
    }

    // ── CREATE ORDER ──────────────────────────────────────────────────────────

    @Override
    public Map<String, String> createOrder(BigDecimal amountVnd, Integer paymentId, String description) {
        String accessToken = fetchAccessToken();
        BigDecimal amountConverted = "VND".equalsIgnoreCase(paypalConfig.getCurrency())
                ? amountVnd.setScale(0, java.math.RoundingMode.HALF_UP)
                : exchangeRateService.convertVndToUsd(amountVnd);

        String url = paypalConfig.getApiBaseUrl() + "/v2/checkout/orders";

        Map<String, Object> amount = new HashMap<>();
        amount.put("currency_code", paypalConfig.getCurrency());
        amount.put("value", amountConverted.toPlainString());

        Map<String, Object> purchaseUnit = new HashMap<>();
        purchaseUnit.put("reference_id", "PAY" + paymentId);
        purchaseUnit.put("custom_id", String.valueOf(paymentId));
        purchaseUnit.put("description", description);
        purchaseUnit.put("amount", amount);

        Map<String, Object> applicationContext = new HashMap<>();
        applicationContext.put("return_url", resolveDynamicUrl("/api/v1/payments/paypal-return"));
        applicationContext.put("cancel_url", resolveDynamicUrl("/api/v1/payments/paypal-cancel"));
        applicationContext.put("brand_name", "AutoWash Pro");
        applicationContext.put("user_action", "PAY_NOW");
        applicationContext.put("shipping_preference", "NO_SHIPPING");

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("intent", "CAPTURE");
        requestBody.put("purchase_units", List.of(purchaseUnit));
        requestBody.put("application_context", applicationContext);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(accessToken);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);
            JsonNode json = objectMapper.readTree(response.getBody());

            String orderId = json.get("id").asText();
            String approvalUrl = null;
            for (JsonNode link : json.get("links")) {
                if ("approve".equals(link.get("rel").asText())) {
                    approvalUrl = link.get("href").asText();
                    break;
                }
            }

            if (approvalUrl == null) {
                throw new BusinessException("PayPal không trả về link thanh toán (approve link)");
            }

            Map<String, String> result = new HashMap<>();
            result.put("orderId", orderId);
            result.put("approvalUrl", approvalUrl);
            result.put("amount", amountConverted.toPlainString());
            result.put("currency", paypalConfig.getCurrency());
            return result;
        } catch (BusinessException e) {
            throw e;
        } catch (HttpClientErrorException e) {
            log.error("PayPal trả lỗi khi tạo order: {}", e.getResponseBodyAsString());
            throw new BusinessException("PayPal từ chối tạo đơn hàng: " + e.getStatusCode());
        } catch (Exception e) {
            log.error("Lỗi tạo PayPal order: {}", e.getMessage());
            throw new BusinessException("Không tạo được đơn hàng PayPal");
        }
    }

    // ── CAPTURE ORDER ─────────────────────────────────────────────────────────

    @Override
    public Map<String, String> captureOrder(String orderId) {
        String accessToken = fetchAccessToken();
        String url = paypalConfig.getApiBaseUrl() + "/v2/checkout/orders/" + orderId + "/capture";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(accessToken);

        HttpEntity<Void> entity = new HttpEntity<>(headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);
            JsonNode json = objectMapper.readTree(response.getBody());

            String status = json.path("status").asText(null);

            JsonNode purchaseUnits = json.path("purchase_units");
            String captureId = null;
            if (purchaseUnits.isArray() && purchaseUnits.size() > 0) {
                JsonNode captures = purchaseUnits.get(0).path("payments").path("captures");
                if (captures.isArray() && captures.size() > 0) {
                    captureId = captures.get(0).path("id").asText(null);
                }
            }

            String payerEmail = json.path("payer").path("email_address").asText(null);

            Map<String, String> result = new HashMap<>();
            result.put("status", status);
            result.put("captureId", captureId);
            result.put("payerEmail", payerEmail);
            return result;
        } catch (HttpClientErrorException e) {
            // Trường hợp order đã được capture trước đó (double-click, retry) —
            // PayPal trả 422 UNPROCESSABLE_ENTITY với lỗi ORDER_ALREADY_CAPTURED.
            log.warn("PayPal capture lỗi cho order {}: {}", orderId, e.getResponseBodyAsString());
            if (e.getResponseBodyAsString().contains("ORDER_ALREADY_CAPTURED")) {
                Map<String, String> result = new HashMap<>();
                result.put("status", "COMPLETED");
                result.put("captureId", null);
                result.put("payerEmail", null);
                return result;
            }
            throw new BusinessException("PayPal từ chối xác nhận thanh toán: " + e.getStatusCode());
        } catch (Exception e) {
            log.error("Lỗi capture PayPal order {}: {}", orderId, e.getMessage());
            throw new BusinessException("Không xác nhận được thanh toán PayPal");
        }
    }

    private String resolveDynamicUrl(String path) {
        try {
            String configured = paypalConfig.getReturnUrl();
            String configuredHost = configured != null
                    ? java.net.URI.create(configured).getHost()
                    : null;
            if (configuredHost != null
                    && !"localhost".equals(configuredHost)
                    && !"127.0.0.1".equals(configuredHost)) {
                return configured.startsWith("http")
                        ? configured.replaceFirst("/api/v1/payments/paypal-return", path)
                        : configured;
            }
        } catch (Exception ignored) {
        }

        String proto = request.getHeader("X-Forwarded-Proto");
        if (proto == null || proto.isBlank()) proto = request.getScheme();
        String host = request.getHeader("X-Forwarded-Host");
        if (host == null || host.isBlank()) host = request.getHeader("Host");

        if (host != null && !host.isBlank()) {
            String hostOnly = host.contains(":")
                    ? host.substring(0, host.lastIndexOf(':')).trim().toLowerCase()
                    : host.trim().toLowerCase();
            if (!"localhost".equals(hostOnly)
                    && !"127.0.0.1".equals(hostOnly)
                    && !"::1".equals(hostOnly)) {
                return proto + "://" + host + path;
            }
        }
        return paypalConfig.getReturnUrl().replaceFirst("/api/v1/payments/paypal-return", path);
    }
}