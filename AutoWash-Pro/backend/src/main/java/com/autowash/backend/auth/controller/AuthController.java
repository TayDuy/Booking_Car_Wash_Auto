package com.autowash.backend.auth.controller;

import com.autowash.backend.auth.dto.*;
import com.autowash.backend.auth.entity.RefreshToken;
import com.autowash.backend.auth.service.AuthService;
import com.autowash.backend.auth.service.OtpService;
import com.autowash.backend.auth.service.RefreshTokenService;
import com.autowash.backend.common.dto.ApiResponse;
import com.autowash.backend.security.JwtTokenProvider;
import com.autowash.backend.user.entity.User;
import com.autowash.backend.user.repository.UserRepository;
import com.autowash.backend.auth.service.SseTicketService;
import com.autowash.backend.security.CustomUserDetails;
import com.autowash.backend.security.CookieUtil;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
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
    private final SseTicketService sseTicketService;
    private final UserRepository userRepository;
    private final CookieUtil cookieUtil;

    // Thời hạn sống của refreshToken (giây) - khớp với thời hạn tạo trong RefreshTokenServiceImpl (7 ngày)
    private static final long REFRESH_TOKEN_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

    public AuthController(AuthService authService,
                          OtpService otpService,
                          RefreshTokenService refreshTokenService,
                          JwtTokenProvider tokenProvider,
                          SseTicketService sseTicketService,
                          UserRepository userRepository,
                          CookieUtil cookieUtil) {
        this.authService = authService;
        this.otpService = otpService;
        this.refreshTokenService = refreshTokenService;
        this.tokenProvider = tokenProvider;
        this.sseTicketService = sseTicketService;
        this.userRepository = userRepository;
        this.cookieUtil = cookieUtil;
    }

    /**
     * Đưa refreshToken vào HttpOnly cookie và xóa khỏi response body,
     * để JS phía client không bao giờ đọc được refreshToken (chống XSS đánh cắp token dài hạn).
     */
    private LoginResponseDTO withRefreshTokenAsCookie(LoginResponseDTO response, HttpServletResponse httpResponse) {
        if (response != null && StringUtils.hasText(response.getRefreshToken())) {
            cookieUtil.setRefreshTokenCookie(httpResponse, response.getRefreshToken(), REFRESH_TOKEN_MAX_AGE_SECONDS);
            response.setRefreshToken(null); // không trả về body nữa
        }
        return response;
    }

    /**
     * POST /api/v1/auth/login
     * refreshToken được set vào HttpOnly cookie, không nằm trong response body.
     */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponseDTO>> login(
            @Valid @RequestBody LoginRequestDTO request,
            HttpServletResponse httpResponse) {

        LoginResponseDTO response = authService.login(request);
        response = withRefreshTokenAsCookie(response, httpResponse);
        return ResponseEntity.ok(ApiResponse.success("Đăng nhập thành công", response));
    }

    /**
     * POST /api/v1/auth/register
     */
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<LoginResponseDTO>> register(
            @Valid @RequestBody RegisterRequestDTO request,
            HttpServletResponse httpResponse) {

        LoginResponseDTO response = authService.register(request);
        response = withRefreshTokenAsCookie(response, httpResponse);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.created(response));
    }

    /**
     * POST /api/v1/auth/logout
     * Xóa refreshToken trong DB + xóa cookie refreshToken.
     */
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            HttpServletResponse httpResponse) {

        String token = null;
        if (StringUtils.hasText(authHeader) && authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7);
        }

        authService.logout(token);
        cookieUtil.clearRefreshTokenCookie(httpResponse);
        return ResponseEntity.ok(ApiResponse.success("Đăng xuất thành công", null));
    }

    /**
     * GET /api/v1/auth/me
     */
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<String>> getCurrentUser(
            @AuthenticationPrincipal
            org.springframework.security.core.userdetails.UserDetails userDetails) {

        return ResponseEntity.ok(
                ApiResponse.success("Token hợp lệ", userDetails.getUsername()));
    }

    @PostMapping("/send-otp")
    public ResponseEntity<ApiResponse<Void>> sendOtp(@Valid @RequestBody OtpRequestDTO request,
                                                     HttpServletRequest httpRequest){
        otpService.sendOtp(request.getEmail(), OtpService.PURPOSE_GENERAL, getClientIp(httpRequest));
        return ResponseEntity.ok(ApiResponse.success("Mã OTP đã được gửi", null));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<ApiResponse<Void>> verifyOtp(@Valid@RequestBody OtpVerifyDTO request){
        String purpose = request.getPurpose();
        if (purpose == null || purpose.trim().isEmpty()) {
            purpose = com.autowash.backend.auth.service.OtpService.PURPOSE_GENERAL;
        }
        otpService.verifyOtp(request.getEmail(), request.getOtp(), purpose);
        return ResponseEntity.ok(ApiResponse.success("Xác minh OTP thành công", null));
    }

    /**
     * POST /api/v1/auth/refresh
     * Không cần body: refreshToken được trình duyệt tự gửi kèm qua HttpOnly cookie.
     * Frontend PHẢI gọi với { withCredentials: true } thì cookie mới được gửi.
     */
    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<TokenRefreshResponseDTO>> refreshJwtToken(
            @CookieValue(name = CookieUtil.REFRESH_TOKEN_COOKIE_NAME, required = false) String requestRefreshToken,
            HttpServletResponse httpResponse
    ){
        if (!StringUtils.hasText(requestRefreshToken)) {
            throw new com.autowash.backend.common.exception.BusinessException(
                    "Không tìm thấy refresh token, vui lòng đăng nhập lại",
                    HttpStatus.UNAUTHORIZED
            );
        }

        RefreshToken refreshToken = refreshTokenService.findByToken(requestRefreshToken);

        refreshTokenService.verifyExpiration(refreshToken);

        User user = refreshToken.getUser();

        // Rotate: token cũ bị vô hiệu hóa, token mới được set lại vào cookie
        RefreshToken rotatedToken = refreshTokenService.createRefreshToken(user.getId());

        String token = tokenProvider.generateToken(user.getEmail(), user.getId(), user.getPassword());

        cookieUtil.setRefreshTokenCookie(httpResponse, rotatedToken.getToken(), REFRESH_TOKEN_MAX_AGE_SECONDS);

        TokenRefreshResponseDTO responseDTO = TokenRefreshResponseDTO.builder()
                .accessToken(token)
                .refreshToken(null) // không trả về body nữa, đã nằm trong HttpOnly cookie
                .build();

        return ResponseEntity.ok(ApiResponse.success("Refresh token thành công", responseDTO));
    }

    /**
     * POST /api/v1/auth/google
     */
    @PostMapping("/google")
    public ResponseEntity<ApiResponse<LoginResponseDTO>> googleLogin(
            @Valid @RequestBody GoogleLoginRequestDTO request,
            HttpServletResponse httpResponse
    ){
        LoginResponseDTO response = authService.loginWithGoogle(request.getSupabaseToken());
        response = withRefreshTokenAsCookie(response, httpResponse);

        return ResponseEntity.ok(ApiResponse.success("Đăng nhập Google thành công!!!",response));
    }

    @PutMapping("/change-password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @Valid @RequestBody ChangePasswordRequestDTO request,
            @AuthenticationPrincipal com.autowash.backend.security.CustomUserDetails userDetails) {
        authService.changePassword(userDetails.getId(), request.getOldPassword(), request.getNewPassword());
        return ResponseEntity.ok(ApiResponse.success("Đổi mật khẩu thành công", null));
    }

    @PostMapping("/forgot-password/request")
    public ResponseEntity<ApiResponse<Void>> requestForgotPassword(
            @Valid @RequestBody ForgotPasswordRequestDTO request,
            HttpServletRequest httpRequest) {
        authService.requestForgotPasswordOtp(request.getEmail(), getClientIp(httpRequest));
        return ResponseEntity.ok(ApiResponse.success("Nếu email hợp lệ, mã OTP phục hồi sẽ được gửi", null));
    }

    @PostMapping("/forgot-password/reset")
    public ResponseEntity<ApiResponse<Void>> resetForgotPassword(
            @Valid @RequestBody ForgotPasswordResetDTO request) {
        authService.verifyAndResetPassword(request.getEmail(), request.getOtp(), request.getNewPassword());
        return ResponseEntity.ok(ApiResponse.success("Đặt lại mật khẩu thành công", null));
    }

    @PostMapping("/sse-ticket")
    public ResponseEntity<ApiResponse<String>> createSseTicket(
            @AuthenticationPrincipal org.springframework.security.core.userdetails.UserDetails userDetails) {
        if (userDetails == null) {
            throw new com.autowash.backend.common.exception.BusinessException(
                    "Chưa đăng nhập hoặc phiên làm việc đã hết hạn",
                    HttpStatus.UNAUTHORIZED
            );
        }

        Integer userId;
        if (userDetails instanceof CustomUserDetails) {
            userId = ((CustomUserDetails) userDetails).getId();
        } else {
            User user = userRepository.findByEmailIgnoreCase(userDetails.getUsername())
                    .or(() -> userRepository.findByUsernameIgnoreCase(userDetails.getUsername()))
                    .orElseThrow(() -> new com.autowash.backend.common.exception.BusinessException(
                            "Không tìm thấy người dùng",
                            HttpStatus.NOT_FOUND
                    ));
            userId = user.getId();
        }

        String ticket = sseTicketService.createTicket(userId);
        return ResponseEntity.ok(ApiResponse.success("Tạo vé kết nối thành công", ticket));
    }

    private String getClientIp(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (StringUtils.hasText(forwardedFor)) {
            return forwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

}