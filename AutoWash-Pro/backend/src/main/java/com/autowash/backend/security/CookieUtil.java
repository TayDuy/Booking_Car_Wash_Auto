package com.autowash.backend.security;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

import java.time.Duration;

/**
 * Helper set / clear HttpOnly cookie cho refreshToken.
 * Refresh token KHÔNG còn trả về trong response body -> JS không đọc được -> giảm rủi ro XSS.
 */
@Component
public class CookieUtil {

    public static final String REFRESH_TOKEN_COOKIE_NAME = "refreshToken";
    // Path hẹp: cookie chỉ được trình duyệt gửi kèm cho các request tới /api/v1/auth/**
    private static final String COOKIE_PATH = "/api/v1/auth";

    // secure=false khi chạy local qua http, secure=true khi deploy https (set qua application.properties)
    @Value("${app.cookie.secure:false}")
    private boolean secureCookie;

    // Strict: chặt nhất, nhưng flow OAuth redirect (Google) đôi khi cần Lax.
    @Value("${app.cookie.same-site:Lax}")
    private String sameSite;

    public void setRefreshTokenCookie(HttpServletResponse response, String refreshToken, long maxAgeSeconds) {
        ResponseCookie cookie = ResponseCookie.from(REFRESH_TOKEN_COOKIE_NAME, refreshToken)
                .httpOnly(true)
                .secure(secureCookie)
                .sameSite(sameSite)
                .path(COOKIE_PATH)
                .maxAge(Duration.ofSeconds(maxAgeSeconds))
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    public void clearRefreshTokenCookie(HttpServletResponse response) {
        ResponseCookie cookie = ResponseCookie.from(REFRESH_TOKEN_COOKIE_NAME, "")
                .httpOnly(true)
                .secure(secureCookie)
                .sameSite(sameSite)
                .path(COOKIE_PATH)
                .maxAge(0) // xóa ngay lập tức
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }
}