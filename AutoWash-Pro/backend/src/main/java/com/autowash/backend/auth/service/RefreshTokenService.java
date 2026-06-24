package com.autowash.backend.auth.service;

import com.autowash.backend.auth.entity.RefreshToken;

public interface RefreshTokenService {

    //Tạo 1 mã Refresh Token mới cho User
    RefreshToken createRefreshToken(Integer userId);

    //Kiểm tra xem Refresh token có còn hạn sử dụng không
    RefreshToken verifyExpiration(RefreshToken token);

    //xóa token (Dùng khi user đăng xuất)
    void deleteByUserId(Integer userId);

    //Tìm kiếm token trong Database
    RefreshToken findByToken(String token);
}
