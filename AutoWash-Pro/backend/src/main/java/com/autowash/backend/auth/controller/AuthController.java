package com.autowash.pro.auth.controller;

import com.autowash.pro.auth.dto.LoginRequestDTO;
import com.autowash.pro.auth.dto.LoginResponseDTO;
import com.autowash.pro.auth.dto.RegisterRequestDTO;
import com.autowash.pro.auth.service.AuthService;
import com.autowash.pro.common.dto.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    /**
     * POST /api/v1/auth/login
     * Body: { "email": "...", "password": "..." }
     * Response: { status, message, data: { accessToken, tokenType, userId, email, fullName, role } }
     */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponseDTO>> login(
            @Valid @RequestBody LoginRequestDTO request) {

        LoginResponseDTO response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success("Đăng nhập thành công", response));
    }

    /**
     * POST /api/v1/auth/register
     * Body: { "email", "password", "fullName", "phone" }
     * Response 201: { status, message, data: { accessToken, ... } }
     */
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<LoginResponseDTO>> register(
            @Valid @RequestBody RegisterRequestDTO request) {

        LoginResponseDTO response = authService.register(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.created(response));
    }

    /**
     * POST /api/v1/auth/logout
     * Header: Authorization: Bearer <token>
     *
     * Với JWT stateless, client chỉ cần xóa token phía local.
     * Server-side: clear SecurityContext (+ blacklist nếu cần).
     */
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        String token = null;
        if (StringUtils.hasText(authHeader) && authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7);
        }

        authService.logout(token);
        return ResponseEntity.ok(ApiResponse.success("Đăng xuất thành công", null));
    }

    /**
     * GET /api/v1/auth/me  — kiểm tra token còn hợp lệ không
     * Yêu cầu: đã xác thực (token hợp lệ)
     */
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<String>> getCurrentUser(
            @AuthenticationPrincipal
            org.springframework.security.core.userdetails.UserDetails userDetails) {

        return ResponseEntity.ok(
                ApiResponse.success("Token hợp lệ", userDetails.getUsername()));
    }
}