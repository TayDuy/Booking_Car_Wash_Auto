package com.autowash.backend.auth.service.impl;

import com.autowash.backend.auth.dto.LoginRequestDTO;
import com.autowash.backend.auth.dto.LoginResponseDTO;
import com.autowash.backend.auth.dto.RegisterRequestDTO;
import com.autowash.backend.auth.service.AuthService;
import com.autowash.backend.auth.service.OtpService;
import com.autowash.backend.common.exception.BusinessException;
import com.autowash.backend.customer.entity.Customer;
import com.autowash.backend.security.CustomUserDetails;
import com.autowash.backend.security.JwtTokenProvider;
import com.autowash.backend.customer.repository.CustomerRepository;
import com.autowash.backend.user.entity.User;
import com.autowash.backend.user.repository.UserRepository;
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
    private final CustomerRepository customerRepository;
    private final OtpService otpService;

    public AuthServiceImpl(AuthenticationManager authenticationManager,
                           UserRepository userRepository,
                           PasswordEncoder passwordEncoder,
                           JwtTokenProvider jwtTokenProvider,
                           CustomerRepository customerRepository, OtpService otpService) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
        this.customerRepository = customerRepository;
        this.otpService = otpService;
    }

    @Override
    @Transactional(readOnly = true)
    public LoginResponseDTO login(LoginRequestDTO request) {
        // Xác thực email + password qua Spring Security
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getUsername().trim().toLowerCase(),
                        request.getPassword()
                )
        );

        // Lưu vào SecurityContext (tùy chọn với stateless JWT)
        SecurityContextHolder.getContext().setAuthentication(authentication);

        // Lấy thông tin user
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        User user = userRepository.findById(userDetails.getId())
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

        // Kiểm tra username đã tồn tại
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new BusinessException("Tài khoản '" + request.getUsername() + "' đã được sử dụng");
        }

        // Kiểm tra số điện thoại đã tồn tại
        if (userRepository.existsByPhone(request.getPhone())) {
            throw new BusinessException("Số điện thoại '" + request.getPhone()
                    + "' đã được sử dụng");
        }

        //kiểm tra phone đã được xác minh
        if(!otpService.isPhoneVerified(request.getPhone())){
            throw new BusinessException("số điện thoại chưa được xác minh OTP");
        }

        // Tạo user mới (mặc định role CUSTOMER)
        User newUser = User.builder()
                .username(request.getUsername()) // <-- Lấy username từ form Đăng ký
                .email(normalizedEmail)
                .password(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone() != null ? request.getPhone().trim() : "")
                .role("customer")
                .status("active")
                .build();

        User savedUser = userRepository.save(newUser);

        // Tạo thông tin khách hàng (Customer)
        Customer newCustomer = Customer.builder()
                .user(savedUser)   // lỗi nè
                .fullName(request.getFullName() != null
                        ? request.getFullName().trim()
                        : "")
                .build();
        customerRepository.save(newCustomer);

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
        String fullName = "Unknown";
        if ("customer".equalsIgnoreCase(user.getRole())) {
            fullName = customerRepository.findByUserId(user.getId())
                    .map(Customer::getFullName)
                    .orElse("Khách hàng");
        }

        return LoginResponseDTO.builder()
                .accessToken(token)
                .tokenType("Bearer")
                .userId(user.getId())
                .username(user.getUsername()) // <-- Thêm vào đúng chỗ này
                .email(user.getEmail())
                .fullName(fullName)
                .role(user.getRole().toUpperCase())
                .build();
    }
}