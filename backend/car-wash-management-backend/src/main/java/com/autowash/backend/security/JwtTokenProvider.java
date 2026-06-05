package com.autowash.backend.security;

import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Map;
import java.util.HashMap;
import java.util.StringJoiner;
import java.util.concurrent.TimeUnit;

@Component
public class JwtTokenProvider {

    // Secret key dùng để ký token (trong production nên đưa vào application.yaml)
    private static final String SECRET_KEY = "mySecretKeymySecretKeymySecretKey123456";
    private static final long EXPIRATION_MS = TimeUnit.DAYS.toMillis(1); // Token hết hạn sau 1 ngày

    // Tạo token từ username và role
    public String generateToken(String username, String role) {
        long now = System.currentTimeMillis();
        long exp = now + EXPIRATION_MS;

        Map<String, String> payload = new HashMap<>();
        payload.put("sub", username);
        payload.put("role", role);
        payload.put("iat", String.valueOf(now));
        payload.put("exp", String.valueOf(exp));

        String body = encodePayload(payload);
        String sig = sign(body);

        return body + "." + sig;
    }

    // Lấy username từ token
    public String getUsername(String token) {
        if (token == null) return null;
        String[] parts = token.split("\\.");
        if (parts.length != 2) return null;
        Map<String, String> payload = decodePayload(parts[0]);
        return payload.get("sub");
    }

    // Kiểm tra token có hợp lệ không
    public boolean validateToken(String token) {
        try {
            if (token == null) return false;
            String[] parts = token.split("\\.");
            if (parts.length != 2) return false;
            String body = parts[0];
            String sig = parts[1];
            if (!sign(body).equals(sig)) return false;
            Map<String, String> payload = decodePayload(body);
            String expStr = payload.get("exp");
            if (expStr == null) return false;
            long exp = Long.parseLong(expStr);
            return System.currentTimeMillis() < exp;
        } catch (Exception ex) {
            return false;
        }
    }

    private String encodePayload(Map<String, String> payload) {
        StringJoiner sj = new StringJoiner(";");
        payload.forEach((k, v) -> sj.add(k + "=" + v));
        return Base64.getUrlEncoder().withoutPadding()
                .encodeToString(sj.toString().getBytes(StandardCharsets.UTF_8));
    }

    private Map<String, String> decodePayload(String encoded) {
        try {
            String decoded = new String(
                    Base64.getUrlDecoder().decode(encoded), StandardCharsets.UTF_8);
            Map<String, String> map = new HashMap<>();
            String[] pairs = decoded.split(";");
            for (String p : pairs) {
                int idx = p.indexOf('=');
                if (idx > 0) {
                    map.put(p.substring(0, idx), p.substring(idx + 1));
                }
            }
            return map;
        } catch (Exception ex) {
            return new HashMap<>();
        }
    }

    private String sign(String data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec keySpec = new SecretKeySpec(
                    SECRET_KEY.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            mac.init(keySpec);
            byte[] sig = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(sig);
        } catch (Exception ex) {
            throw new RuntimeException("Failed to sign token", ex);
        }
    }
}
