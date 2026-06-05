package com.autowash.pro.auth.service;

import com.autowash.pro.auth.dto.LoginRequestDTO;
import com.autowash.pro.auth.dto.LoginResponseDTO;
import com.autowash.pro.auth.dto.RegisterRequestDTO;

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
}