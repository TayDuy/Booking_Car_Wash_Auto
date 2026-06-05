package com.autowash.backend.auth.controller;

import com.autowash.backend.auth.dto.LoginRequestDTO;
import com.autowash.backend.auth.dto.LoginResponseDTO;
import com.autowash.backend.auth.dto.RegisterRequestDTO;
import com.autowash.backend.auth.service.AuthService;
import com.autowash.backend.common.dto.ApiResponse;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ApiResponse<LoginResponseDTO> login(
            @RequestBody LoginRequestDTO request) {

        LoginResponseDTO response = authService.login(request);

        return ApiResponse.<LoginResponseDTO>builder()
                .code(1000)
                .message("Đăng nhập thành công")
                .result(response)
                .build();
    }

    @PostMapping("/register")
    public ApiResponse<String> register(
            @RequestBody RegisterRequestDTO request) {

        authService.register(request);

        return ApiResponse.<String>builder()
                .code(1000)
                .message("Đăng ký thành công")
                .result("Register successful")
                .build();
    }
}
