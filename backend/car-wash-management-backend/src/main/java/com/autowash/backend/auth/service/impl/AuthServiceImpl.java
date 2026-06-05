package com.autowash.pro.auth.service.impl;

import com.autowash.pro.auth.dto.LoginRequestDTO;
import com.autowash.pro.auth.dto.LoginResponseDTO;
import com.autowash.pro.auth.dto.RegisterRequestDTO;
import com.autowash.pro.auth.service.AuthService;
import com.autowash.pro.common.exception.BusinessException;
import com.autowash.pro.security.CustomUserDetails;
import com.autowash.pro.security.JwtTokenProvider;
import com.autowash.pro.user.entity.User;
import com.autowash.pro.user.enums.Role;
import com.autowash.pro.user.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthServiceImpl implements AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    public AuthServiceImpl(AuthenticationManager authenticationManager,
                           UserRepository userRepository,
                           PasswordEncoder passwordEncoder,
                           JwtTokenProvider jwtTokenProvider) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @Override
    @Transactional(readOnly = true)
    public LoginResponseDTO login(LoginRequestDTO request) {
        // Xác thực email + password qua Spring Security
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail().trim().toLowerCase(),
                        request.getPassword()
                )
        );

        // Lưu vào SecurityContext (tùy chọn với stateless JWT)
        SecurityContextHolder.getContext().setAuthentication(authentication);

        // Lấy thông tin user
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new BusinessException("Không tìm thấy người dùng",
                        HttpStatus.NOT_FOUND));

        // Tạo token
        String token = jwtTokenProvider.generateToken(authentication);

        return buildLoginResponse(token, user);
    }

    @Override
    @Transactional
    public LoginResponseDTO register(RegisterRequestDTO request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();

        // Kiểm tra email đã tồn tại
        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new BusinessException("Email '" + normalizedEmail + "' đã được sử dụng");
        }

        // Kiểm tra số điện thoại đã tồn tại
        if (userRepository.existsByPhone(request.getPhone())) {
            throw new BusinessException("Số điện thoại '" + request.getPhone()
                    + "' đã được sử dụng");
        }

        // Tạo user mới (mặc định role CUSTOMER)
        User newUser = new User(
                normalizedEmail,
                passwordEncoder.encode(request.getPassword()),
                request.getFullName().trim(),
                request.getPhone().trim(),
                Role.CUSTOMER
        );

        User savedUser = userRepository.save(newUser);

        // Auto-login: tạo token ngay sau khi đăng ký
        String token = jwtTokenProvider.generateToken(savedUser.getEmail(), savedUser.getId());

        return buildLoginResponse(token, savedUser);
    }

    @Override
    public void logout(String token) {
        /*
         * JWT là stateless — client tự xóa token.
         * Nếu cần server-side invalidation (bảo mật cao hơn),
         * thêm token vào Redis blacklist tại đây.
         *
         * Ví dụ mở rộng:
         *   long expiry = jwtTokenProvider.getExpirationFromToken(token);
         *   redisTemplate.opsForValue().set("blacklist:" + token, "1",
         *       expiry, TimeUnit.MILLISECONDS);
         */
        SecurityContextHolder.clearContext();
    }

    // ---- Helper ----

    private LoginResponseDTO buildLoginResponse(String token, User user) {
        return new LoginResponseDTO(
                token,
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getRole().name()
        );
    }
}