package com.autowash.backend.auth.service.impl;

import com.autowash.backend.auth.entity.RefreshToken;
import com.autowash.backend.auth.repository.RefreshTokenRepository;
import com.autowash.backend.auth.service.RefreshTokenService;
import com.autowash.backend.common.exception.ResourceNotFoundException;
import com.autowash.backend.user.entity.User;
import com.autowash.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RefreshTokenServiceImpl implements RefreshTokenService {

    //lấy thời gian sống của Refresh Token từ file application.properties
    @Value("${app.jwt.refresh-expiration-ms}")
    private Long refreshTokenDurationMs;

    private final RefreshTokenRepository refreshTokenRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public RefreshToken createRefreshToken(Integer userId) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User","id",userId));

        // Try to find existing refresh token for user; update it to avoid unique-constraint failures under concurrency
        java.util.Optional<RefreshToken> existing = refreshTokenRepository.findByUser(user);
        if(existing.isPresent()){
            RefreshToken token = existing.get();
            token.setToken(UUID.randomUUID().toString());
            token.setExpriryDate(Instant.now().plusMillis(refreshTokenDurationMs));
            return refreshTokenRepository.save(token);
        }

        // no existing token => create new one
        RefreshToken refreshToken = RefreshToken.builder()
                .user(user)
                .token(UUID.randomUUID().toString())
                .expriryDate(Instant.now().plusMillis(refreshTokenDurationMs))//set hạn sử dụng
                .build();
        return refreshTokenRepository.save(refreshToken);
    }

    @Override
    @Transactional
    public RefreshToken verifyExpiration(RefreshToken token) {
        //nếu thời hạn token bé hơn thời gian hiện tại => đã hêt hạn
        if(token.getExpriryDate().compareTo(Instant.now())<0){
            refreshTokenRepository.delete(token);//xóa cho sạch DB
            throw new RuntimeException("Refresh token đã hết hạn.  Vui lòng đăng nhập lại");
        }
        return token;//nếu còn hạn thì trả về bth
    }

    @Override
    @Transactional
    public void deleteByUserId(Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User","id",userId));
        refreshTokenRepository.deleteByUser(user);

    }

    @Override
    public RefreshToken findByToken(String token) {
        return refreshTokenRepository.findByToken(token)
                .orElseThrow(()->new RuntimeException("Refresh token không tồn tại trong hệ thống!"));
    }
}
