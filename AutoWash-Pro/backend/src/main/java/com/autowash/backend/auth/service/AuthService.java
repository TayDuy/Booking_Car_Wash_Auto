package com.autowash.backend.auth.service;

import com.autowash.backend.auth.dto.LoginRequestDTO;
import com.autowash.backend.auth.dto.LoginResponseDTO;
import com.autowash.backend.auth.dto.RegisterRequestDTO;

public interface AuthService {

    /**
     * Đăng nhập — trả về JWT token cùng thông tin cơ bản của user.
     */
    LoginResponseDTO login(LoginRequestDTO request);

    /**
     * Đăng ký tài khoản mới (mặc định role = CUSTOMER).
     * Sau khi đăng ký thành công, tự động trả về token (auto-login).
     */
    LoginResponseDTO register(RegisterRequestDTO request);

    /**
     * Đăng xuất — với JWT stateless, logout phía server chủ yếu là
     * invalidate token (blacklist). Hiện tại trả về message đơn giản.
     * Nếu sau này thêm Redis blacklist, implement tại đây.
     */
    void logout(String token);

    LoginResponseDTO loginWithGoogle(String supabaseToken);
    void requestForgotPasswordOtp(String phone, String requestIp);
    void verifyAndResetPassword(String phone, String otp, String newPassword);
}
