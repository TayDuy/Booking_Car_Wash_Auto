package com.autowash.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
public class CorsConfig {
    public CorsConfigurationSource corsConfigurationSource(){
        CorsConfiguration cofig = new CorsConfiguration();

        //Fontend origin (React chạy port 3000)
        cofig.setAllowedOrigins(List.of("http://localhost:5173"));

        //cho phép tất cả HTTP methods
        cofig.setAllowedMethods(List.of("GET","POST","PUT","DELETE","PATCH"));

        //cho phép tất cả headers(Authorization, Content-Type...)
        cofig.setAllowedHeaders(List.of("*"));

        //cho phép gửi cookie/token
        cofig.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**",cofig);
        return source;
    }



}
