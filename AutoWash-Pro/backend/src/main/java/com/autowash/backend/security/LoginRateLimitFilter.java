package com.autowash.backend.security;

import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class LoginRateLimitFilter extends OncePerRequestFilter {

    private final Map<String, List<Long>> ipRequestTimestamps = new ConcurrentHashMap<>();
    private static final int MAX_REQUESTS_PER_MINUTE = 10;
    private static final long TIME_WINDOW_MS = 60L * 1000; // 1 minute

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        if ("POST".equalsIgnoreCase(request.getMethod()) && request.getRequestURI().endsWith("/auth/login")) {
            String ip = getClientIp(request);
            long now = System.currentTimeMillis();

            boolean limitExceeded = false;
            synchronized (ipRequestTimestamps) {
                List<Long> timestamps = ipRequestTimestamps.computeIfAbsent(ip, k -> new ArrayList<>());
                
                // Clear old timestamps outside 1 minute window
                timestamps.removeIf(timestamp -> now - timestamp > TIME_WINDOW_MS);
                
                if (timestamps.size() >= MAX_REQUESTS_PER_MINUTE) {
                    limitExceeded = true;
                } else {
                    timestamps.add(now);
                }
            }

            if (limitExceeded) {
                response.setStatus(429); // Too Many Requests
                response.setContentType("application/json;charset=UTF-8");
                response.getWriter().write("{\"status\": 429, \"message\": \"Yêu cầu quá nhiều lần. Vui lòng thử lại sau 1 phút.\"}");
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    private String getClientIp(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (org.springframework.util.StringUtils.hasText(forwardedFor)) {
            return forwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
