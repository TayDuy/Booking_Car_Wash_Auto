package com.autowash.backend.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
public class JwtTokenProvider {

    private static final Logger logger = LoggerFactory.getLogger(JwtTokenProvider.class);

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    @Value("${app.jwt.expiration-ms}")
    private long jwtExpirationMs;

    private SecretKey getSigningKey() {
        byte[] keyBytes = jwtSecret.getBytes(StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    /**
     * Tạo JWT token từ Authentication object (sau khi login thành công).
     */
    public String generateToken(Authentication authentication) {
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        return buildToken(userDetails.getUsername(), userDetails.getId(), userDetails.getPassword());
    }

    /**
     * Tạo JWT token trực tiếp từ email + userId (dùng khi register xong tự động login).
     */
    public String generateToken(String email, Integer userId, String passwordHash) {
        return buildToken(email, userId, passwordHash);
    }

    private String buildToken(String email, Integer userId, String passwordHash) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpirationMs);
        String passwordSig = generatePasswordSignature(passwordHash);

        return Jwts.builder()
                .subject(email)
                .claim("userId", userId)
                .claim("pwdSig", passwordSig)
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(getSigningKey())
                .compact();
    }

    /**
     * Lấy email từ JWT token.
     */
    public String getEmailFromToken(String token) {
        return parseClaims(token).getSubject();
    }

    /**
     * Lấy userId từ JWT token.
     */
    public Integer getUserIdFromToken(String token) {
        Claims claims = parseClaims(token);
        return claims.get("userId", Integer.class);
    }

    /**
     * Validate JWT token — trả về true nếu hợp lệ.
     */
    public boolean validateToken(String token) {
        try {
            parseClaims(token);
            return true;
        } catch (MalformedJwtException e) {
            logger.error("JWT không hợp lệ: {}", e.getMessage());
        } catch (ExpiredJwtException e) {
            logger.warn("JWT đã hết hạn: {}", e.getMessage());
        } catch (UnsupportedJwtException e) {
            logger.error("JWT không được hỗ trợ: {}", e.getMessage());
        } catch (IllegalArgumentException e) {
            logger.error("JWT rỗng: {}", e.getMessage());
        }
        return false;
    }

    public String getPasswordSignatureFromToken(String token) {
        try {
            Claims claims = parseClaims(token);
            return claims.get("pwdSig", String.class);
        } catch (Exception e) {
            return null;
        }
    }

    public String generatePasswordSignature(String passwordHash) {
        if (passwordHash == null) {
            return "";
        }
        try {
            java.security.MessageDigest digest = java.security.MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(passwordHash.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            return passwordHash;
        }
    }

    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}