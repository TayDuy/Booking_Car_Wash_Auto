package com.autowash.backend.auth.controller;

import com.autowash.backend.auth.dto.*;
import com.autowash.backend.auth.entity.RefreshToken;
import com.autowash.backend.auth.service.AuthService;
import com.autowash.backend.auth.service.OtpService;
import com.autowash.backend.auth.service.RefreshTokenService;
import com.autowash.backend.common.dto.ApiResponse;
import com.autowash.backend.security.JwtTokenProvider;
import com.autowash.backend.user.entity.User;
import jakarta.servlet.http.HttpServletRequest;
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
    private final OtpService otpService;
    private final RefreshTokenService refreshTokenService;
    private final JwtTokenProvider tokenProvider;

    public AuthController(AuthService authService, OtpService otpService, RefreshTokenService refreshTokenService, JwtTokenProvider tokenProvider) {
        this.authService = authService;
        this.otpService = otpService;
        this.refreshTokenService = refreshTokenService;
        this.tokenProvider = tokenProvider;
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

    /**
     * POST /api/v1/auth/send-otp
     * Body: { "phone": "0912345678" }
     */
    @PostMapping("/send-otp")
    public ResponseEntity<ApiResponse<Void>> sendOtp(@Valid @RequestBody OtpRequestDTO request,
                                                     HttpServletRequest httpRequest){
        otpService.sendOtp(request.getPhone(), OtpService.PURPOSE_GENERAL, getClientIp(httpRequest));
        return ResponseEntity.ok(ApiResponse.success("Mã otp đã được gửi", null));
    }

    /**
     * POST /api/v1/auth/verify-otp
     * Body: { "phone": "0912345678", "otp": "123456" }
     */
    @PostMapping("/verify-otp")
    public ResponseEntity<ApiResponse<Void>> verifyOtp(@Valid@RequestBody OtpVerifyDTO request){
        otpService.verifyOtp(request.getPhone(), request.getOtp());
        return ResponseEntity.ok(ApiResponse.success("Xác minh OTP thành công", null));
    }

    @PostMapping("/refresh")
    public ResponseEntity<TokenRefreshResponseDTO> refreshJwtToken(
        @Valid @RequestBody TokenRefreshRequestDTO request
    ){
        String requestRefreshToken = request.getRefreshToken();

        //tìm thẻ trong DB
        RefreshToken refreshToken = refreshTokenService.findByToken(requestRefreshToken);

        //kiểm tra xem còn hạn hay không ?
        refreshTokenService.verifyExpiration(refreshToken);

        //lấy thông tin của cái thẻ ra
        User user = refreshToken.getUser();

        // in ra cái thẻ normal mới
        String token = tokenProvider.generateToken(user.getEmail(),user.getId());

        //gửi tra fontend thẻ bth mới với cả thẻ vip cũ

        TokenRefreshResponseDTO responseDTO = TokenRefreshResponseDTO.builder()
                .accessToken(token)
                .refreshToken(requestRefreshToken)
                .build();

        return ResponseEntity.ok(responseDTO);
    }

    /**
     * POST /api/v1/auth/google
     * Xử lý đăng nhập bằng Google (Frontend gửi Supabase Token lên)
     */
    @PostMapping("/google")
    public ResponseEntity<ApiResponse<LoginResponseDTO>> googleLogin(
            @Valid @RequestBody GoogleLoginRequestDTO request
    ){
        //gọi hàm loginWithGoogle bên AuthService
        LoginResponseDTO response = authService.loginWithGoogle(request.getSupabaseToken());

        return ResponseEntity.ok(ApiResponse.success("Đăng nhập Google thành công!!!",response));
    }

    @PostMapping("/forgot-password/request")
    public ResponseEntity<ApiResponse<Void>> requestForgotPassword(
            @Valid @RequestBody ForgotPasswordRequestDTO request,
            HttpServletRequest httpRequest) {
        authService.requestForgotPasswordOtp(request.getPhone(), getClientIp(httpRequest));
        return ResponseEntity.ok(ApiResponse.success("Nếu số điện thoại hợp lệ, mã OTP phục hồi sẽ được gửi", null));
    }

    @PostMapping("/forgot-password/reset")
    public ResponseEntity<ApiResponse<Void>> resetForgotPassword(
            @Valid @RequestBody ForgotPasswordResetDTO request) {
        authService.verifyAndResetPassword(request.getPhone(), request.getOtp(), request.getNewPassword());
        return ResponseEntity.ok(ApiResponse.success("Đặt lại mật khẩu thành công", null));
    }

    private String getClientIp(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (StringUtils.hasText(forwardedFor)) {
            return forwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

}
