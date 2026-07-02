package com.autowash.backend.config;

import com.autowash.backend.security.CustomUserDetailsService;
import com.autowash.backend.security.JwtAuthenticationFilter;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final CustomUserDetailsService userDetailsService;
    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(CustomUserDetailsService userDetailsService,
                          JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.userDetailsService = userDetailsService;
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration authenticationConfiguration) throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // Bật CORS (cấu hình chi tiết nằm ở CorsConfig.java)
                .cors(org.springframework.security.config.Customizer.withDefaults())

                // Tắt CSRF vì dùng JWT stateless — không có session cookie cần bảo vệ
                .csrf(AbstractHttpConfigurer::disable)

                // Không lưu session phía server; mỗi request phải tự mang token
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // Trả JSON thay vì redirect khi xác thực thất bại
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint((request, response, authException) -> {
                            // 401 — chưa đăng nhập hoặc token hết hạn / không hợp lệ
                            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                            response.getWriter().write("{\"status\": 401, \"message\": \"Bạn chưa đăng nhập\"}");
                        })
                        .accessDeniedHandler((request, response, accessDeniedException) -> {
                            // 403 — đã đăng nhập nhưng không đủ quyền
                            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                            response.getWriter()
                                    .write("{\"status\": 403, \"message\": \"Bạn không có quyền truy cập\"}");
                        }))

                .authorizeHttpRequests(auth -> auth

                        // ─── Public endpoints (không cần đăng nhập) ───────────────────────
                        // Chỉ các endpoint xác thực mới được truy cập tự do.
                        // /api/v1/support/chat KHÔNG nằm ở đây — yêu cầu phải đăng nhập.
                        // Frontend tự động gắn token qua axiosClient request interceptor.
                        .requestMatchers(
                                "/api/v1/auth/login",                      // Đăng nhập bằng email/password
                                "/api/v1/auth/register",                   // Đăng ký tài khoản mới
                                "/api/v1/auth/send-otp",                   // Gửi mã OTP xác minh email
                                "/api/v1/auth/verify-otp",                 // Xác minh mã OTP
                                "/api/v1/auth/google",                     // Đăng nhập bằng Google OAuth2
                                "/api/v1/auth/refresh",                    // Lấy access token mới từ refresh token
                                "/api/v1/auth/forgot-password/request",    // Gửi OTP quên mật khẩu
                                "/api/v1/auth/forgot-password/reset",      // Đặt lại mật khẩu mới
                                "/swagger-ui/**",                          // Swagger UI (chỉ dùng khi dev/test)
                                "/v3/api-docs/**",                         // OpenAPI spec (chỉ dùng khi dev/test)

                                // VNPAY gọi callback trực tiếp (server-to-server hoặc redirect trình duyệt),
                                // KHÔNG mang theo JWT của user nên phải để public, nếu không sẽ luôn bị 401.
                                "/api/v1/payments/vnpay-return",
                                "/api/v1/payments/vnpay-ipn"
                        ).permitAll()

                        // ─── Admin only ────────────────────────────────────────────────────
                        // Chỉ tài khoản có ROLE_ADMIN mới truy cập được /api/v1/admin/**
                        .requestMatchers("/api/v1/admin/**").hasRole("ADMIN")

                        // ─── Staff + Admin ─────────────────────────────────────────────────
                        // Nhân viên và quản trị viên có thể truy cập /api/v1/staff/**
                        .requestMatchers("/api/v1/staff/**").hasAnyRole("STAFF", "ADMIN")

                        // ─── Mọi endpoint còn lại — bắt buộc đăng nhập ───────────────────
                        // Bao gồm: /api/v1/support/chat, /api/v1/notifications/**, v.v.
                        // Request phải kèm header: Authorization: Bearer <accessToken>
                        // axiosClient.js xử lý việc này tự động qua request interceptor,
                        // và tự refresh token khi nhận 401 qua response interceptor.
                        .anyRequest().authenticated()
                )

                .authenticationProvider(authenticationProvider())
                // Chạy JWT filter trước UsernamePasswordAuthenticationFilter
                // để Spring Security nhận diện user từ token trước khi kiểm tra quyền
                .addFilterBefore(jwtAuthenticationFilter,
                        UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}