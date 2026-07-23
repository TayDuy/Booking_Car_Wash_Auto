package com.autowash.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;

@Configuration
public class CorsConfig {

    @Value("${app.cors.allowed-origins:http://localhost:5173}")
    private String allowedOrigins;

    @Bean
    public CorsConfigurationSource corsConfigurationSource(){
        CorsConfiguration config = new CorsConfiguration();

        List<String> patterns = new ArrayList<>();
        if (allowedOrigins != null && !allowedOrigins.isBlank()) {
            for (String origin : allowedOrigins.split(",")) {
                if (!origin.isBlank()) {
                    patterns.add(origin.trim());
                }
            }
        }
        // Tự động bổ sung các pattern mặc định phổ biến khi deploy Cloud / Vercel / Cloudflare Tunnel
        patterns.add("https://booking-car-wash-auto.vercel.app");
        patterns.add("https://*.trycloudflare.com");
        patterns.add("http://localhost:*");
        patterns.add("http://127.0.0.1:*");

        config.setAllowedOriginPatterns(patterns);

        // cho phép tất cả HTTP methods
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));

        // cho phép tất cả headers(Authorization, Content-Type...)
        config.setAllowedHeaders(List.of("*"));

        // cho phép gửi cookie/token
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }



}
