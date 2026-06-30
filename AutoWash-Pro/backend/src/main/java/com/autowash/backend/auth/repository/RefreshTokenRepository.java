package com.autowash.backend.auth.repository;

import com.autowash.backend.auth.entity.RefreshToken;
import com.autowash.backend.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
//file này xử lý các thao tác truy vấn Db cho bảng refresh_tokens.
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Integer> {

    //Tìm kiếm Refresh Token trong Database dựa vào chuỗi token (dùng khi client gửi yêu cầu refresh)
    Optional<RefreshToken> findByToken(String token);

    // Tìm refresh token theo user (để cập nhật token hiện có)
    Optional<RefreshToken> findByUser(User user);

    //xóa tất cả token của một user(dùng khi user đăng xuất hoặc đổi mật khẩu )
    int deleteByUser(User user);
}
