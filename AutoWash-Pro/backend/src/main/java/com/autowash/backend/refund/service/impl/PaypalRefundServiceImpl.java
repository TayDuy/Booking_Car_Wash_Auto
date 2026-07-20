// backend/src/main/java/com/autowash/backend/refund/service/impl/PaypalRefundServiceImpl.java
package com.autowash.backend.refund.service.impl;

import com.autowash.backend.refund.service.PaypalRefundService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Map;

@Slf4j
@Service
public class PaypalRefundServiceImpl implements PaypalRefundService {

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${paypal.client-id}")
    private String clientId;

    @Value("${paypal.client-secret}")
    private String clientSecret;

    @Value("${paypal.base-url:https://api-m.sandbox.paypal.com}")
    private String baseUrl;

    @Value("${paypal.currency-code:USD}")
    private String currencyCode;

    @Override
    public String refundCapture(String captureId, BigDecimal amount) {
        if (captureId == null || captureId.isBlank()) {
            throw new IllegalStateException("Giao dịch PayPal không có capture id, không thể hoàn tiền tự động.");
        }

        String accessToken = fetchAccessToken();
        String url = baseUrl + "/v2/payments/captures/" + captureId + "/refund";

        Map<String, Object> body = Map.of(
                "amount", Map.of(
                        "value", amount.setScale(2, java.math.RoundingMode.HALF_UP).toPlainString(),
                        "currency_code", currencyCode
                )
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(accessToken);
        headers.set("PayPal-Request-Id", "refund-" + captureId + "-" + System.currentTimeMillis());

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);
            JsonNode json = objectMapper.readTree(response.getBody());

            String status = json.path("status").asText("");
            String refundId = json.path("id").asText("");

            if (!"COMPLETED".equalsIgnoreCase(status)) {
                throw new IllegalStateException(
                        "PayPal trả về trạng thái refund không phải COMPLETED: " + status + " (refund id: " + refundId + ")");
            }

            log.info("Hoàn tiền PayPal thành công. captureId={}, refundId={}, amount={} {}",
                    captureId, refundId, amount, currencyCode);

            return refundId;
        } catch (HttpClientErrorException | HttpServerErrorException e) {
            log.error("Gọi PayPal Refund API thất bại. captureId={}, status={}, body={}",
                    captureId, e.getStatusCode(), e.getResponseBodyAsString());
            throw new RuntimeException(
                    "PayPal từ chối yêu cầu hoàn tiền (HTTP " + e.getStatusCode() + "): " + e.getResponseBodyAsString(), e);
        } catch (Exception e) {
            log.error("Lỗi không xác định khi gọi PayPal Refund API. captureId={}", captureId, e);
            throw new RuntimeException("Lỗi khi gọi PayPal Refund API: " + e.getMessage(), e);
        }
    }

    private String fetchAccessToken() {
        String url = baseUrl + "/v1/oauth2/token";

        String basicAuth = Base64.getEncoder().encodeToString(
                (clientId + ":" + clientSecret).getBytes(StandardCharsets.UTF_8));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        headers.set("Authorization", "Basic " + basicAuth);

        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("grant_type", "client_credentials");

        HttpEntity<MultiValueMap<String, String>> entity = new HttpEntity<>(form, headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);
            JsonNode json = objectMapper.readTree(response.getBody());
            String token = json.path("access_token").asText(null);

            if (token == null || token.isBlank()) {
                throw new IllegalStateException("PayPal không trả về access_token.");
            }
            return token;
        } catch (HttpClientErrorException | HttpServerErrorException e) {
            log.error("Lấy access token PayPal thất bại. status={}, body={}",
                    e.getStatusCode(), e.getResponseBodyAsString());
            throw new RuntimeException(
                    "Không lấy được access token PayPal (HTTP " + e.getStatusCode() + ")", e);
        } catch (Exception e) {
            log.error("Lỗi không xác định khi lấy access token PayPal.", e);
            throw new RuntimeException("Lỗi khi gọi PayPal Refund API: " + e.getMessage(), e);
        }
    }
}