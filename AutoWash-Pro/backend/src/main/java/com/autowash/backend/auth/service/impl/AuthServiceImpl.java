package com.autowash.backend.auth.service.impl;

import com.autowash.backend.auth.dto.LoginRequestDTO;
import com.autowash.backend.auth.dto.LoginResponseDTO;
import com.autowash.backend.auth.dto.RegisterRequestDTO;
import com.autowash.backend.auth.service.AuthService;
import com.autowash.backend.auth.service.OtpService;
import com.autowash.backend.auth.service.RefreshTokenService;
import com.autowash.backend.common.exception.BusinessException;
import com.autowash.backend.customer.entity.Customer;
import com.autowash.backend.customer.repository.CustomerRepository;
import com.autowash.backend.loyaltytier.repository.LoyaltyTierRepository;
import com.autowash.backend.security.CustomUserDetails;
import com.autowash.backend.security.JwtTokenProvider;
import com.autowash.backend.user.entity.User;
import com.autowash.backend.user.repository.UserRepository;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.util.StringUtils;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import com.autowash.backend.mail.service.MailService;

import java.util.Map;
import java.util.Optional;

@Service
public class AuthServiceImpl implements AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final CustomerRepository customerRepository;
    private final OtpService otpService;
    private final LoyaltyTierRepository loyaltyTierRepository;
    private final RefreshTokenService refreshTokenService;
    private final MailService mailService;

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(AuthServiceImpl.class);
    private static final java.security.SecureRandom secureRandom = new java.security.SecureRandom();


    @org.springframework.beans.factory.annotation.Value("${supabase.url}")
    private String supabaseUrl;

    @org.springframework.beans.factory.annotation.Value("${supabase.anon-key}")
    private String supabaseAnonKey;

    public AuthServiceImpl(AuthenticationManager authenticationManager,
                           UserRepository userRepository,
                           PasswordEncoder passwordEncoder,
                           JwtTokenProvider jwtTokenProvider,
                           CustomerRepository customerRepository,
                           OtpService otpService,
                           LoyaltyTierRepository loyaltyTierRepository,
                           RefreshTokenService refreshTokenService,
                           MailService mailService) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
        this.customerRepository = customerRepository;
        this.otpService = otpService;
        this.loyaltyTierRepository = loyaltyTierRepository;
        this.refreshTokenService = refreshTokenService;
        this.mailService = mailService;
    }

    @Override
    @Transactional(noRollbackFor = BusinessException.class)
    public LoginResponseDTO login(LoginRequestDTO request) {
        String identifier = request.getUsername().trim();
        User user = userRepository.findByEmailIgnoreCase(identifier)
                .or(() -> userRepository.findByUsernameIgnoreCase(identifier))
                .orElse(null);

        checkUserLockout(user);

        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getUsername().trim().toLowerCase(),
                            request.getPassword()
                    )
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);

            CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
            User loggedUser = userRepository.findById(userDetails.getId())
                    .orElseThrow(() -> new BusinessException("Khong tim thay nguoi dung", HttpStatus.NOT_FOUND));

            loggedUser.setFailedAttempts(0);
            loggedUser.setLockoutEndTime(null);
            userRepository.save(loggedUser);

            String token = jwtTokenProvider.generateToken(authentication);
            return buildLoginResponse(token, loggedUser);

        } catch (org.springframework.security.core.AuthenticationException e) {
            handleFailedLoginAttempts(user);
            throw new BusinessException("Tài khoản hoặc mật khẩu không chính xác", HttpStatus.BAD_REQUEST);
        }
    }

    private void checkUserLockout(User user) {
        if (user == null || user.getLockoutEndTime() == null) {
            return;
        }
        if (user.getLockoutEndTime().isAfter(java.time.LocalDateTime.now())) {
            long seconds = java.time.Duration.between(java.time.LocalDateTime.now(), user.getLockoutEndTime()).getSeconds();
            if (seconds < 0) seconds = 0;
            String formatted = String.format("%02d:%02d", seconds / 60, seconds % 60);
            throw new BusinessException(
                    "Tài khoản đã bị tạm khóa do nhập sai mật khẩu quá 5 lần. Vui lòng thử lại sau " + formatted + " phút.",
                    HttpStatus.BAD_REQUEST
            );
        } else {
            user.setFailedAttempts(0);
            user.setLockoutEndTime(null);
            userRepository.save(user);
        }
    }

    private void handleFailedLoginAttempts(User user) {
        if (user == null) {
            return;
        }
        int attempts = (user.getFailedAttempts() != null ? user.getFailedAttempts() : 0) + 1;
        user.setFailedAttempts(attempts);
        if (attempts >= 5) {
            user.setLockoutEndTime(java.time.LocalDateTime.now().plusMinutes(5));
            userRepository.save(user);
            throw new BusinessException(
                    "Tài khoản đã bị tạm khóa do nhập sai mật khẩu quá 5 lần. Vui lòng thử lại sau 05:00 phút.",
                    HttpStatus.BAD_REQUEST
            );
        } else {
            userRepository.save(user);
        }
    }

    @Override
    @Transactional
    public LoginResponseDTO register(RegisterRequestDTO request) {
        String normalizedUsername = request.getUsername().trim().toLowerCase();
        String normalizedEmail = request.getEmail().trim().toLowerCase();
        String normalizedPhone = normalizePhone(request.getPhone());

        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)
                || userRepository.existsByUsernameIgnoreCase(normalizedUsername)
                || userRepository.existsByPhone(normalizedPhone)) {
            throw new BusinessException("Thông tin đăng ký (email, tài khoản hoặc số điện thoại) đã được sử dụng");
        }

        if (!otpService.isEmailVerified(normalizedEmail)) {
            throw new BusinessException("Email chua duoc xac minh OTP");
        }

        User newUser = User.builder()
                .username(normalizedUsername)
                .email(normalizedEmail)
                .password(passwordEncoder.encode(request.getPassword()))
                .phone(normalizedPhone)
                .role("customer")
                .status("active")
                .build();

        User savedUser = userRepository.save(newUser);

        Customer newCustomer = Customer.builder()
                .user(savedUser)
                .fullName(request.getFullName() != null ? request.getFullName().trim() : "")
                .tierId(1)
                .build();
        customerRepository.save(newCustomer);

        String token = jwtTokenProvider.generateToken(savedUser.getEmail(), savedUser.getId(), savedUser.getPassword());
        return buildLoginResponse(token, savedUser);
    }

    @Override
    public void logout(String token) {
        if (StringUtils.hasText(token)) {
            try {
                Integer userId = jwtTokenProvider.getUserIdFromToken(token);
                if (userId != null) {
                    refreshTokenService.deleteByUserId(userId);
                }
            } catch (Exception e) {
                log.warn("Không thể xóa refresh token khi logout: {}", e.getMessage());
            }
        }
        SecurityContextHolder.clearContext();
    }

    @Override
    @Transactional
    public LoginResponseDTO loginWithGoogle(String supabaseToken) {
        RestTemplate restTemplate = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(supabaseToken);
        headers.set("apikey", supabaseAnonKey);

        HttpEntity<String> entity = new HttpEntity<>(headers);
        Map<String, Object> body;

        try {
            ResponseEntity<Map> supabaseResponse = restTemplate.exchange(
                    supabaseUrl + "/auth/v1/user",
                    HttpMethod.GET,
                    entity,
                    Map.class
            );
            body = supabaseResponse.getBody();
        } catch (Exception e) {
            throw new BusinessException("Token Google khong hop le hoac da bi chinh sua", HttpStatus.UNAUTHORIZED);
        }

        if (body == null || !body.containsKey("email")) {
            throw new BusinessException("Khong lay duoc email tu Google", HttpStatus.BAD_REQUEST);
        }

        String email = (String) body.get("email");
        Map<String, Object> metadata = (Map<String, Object>) body.get("user_metadata");
        String fullName = metadata != null && metadata.containsKey("full_name")
                ? (String) metadata.get("full_name")
                : "Khach hang Google";

        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            try {
                String randomUsername = "gg_" + java.util.UUID.randomUUID().toString().substring(0, 8);

                user = User.builder()
                        .username(randomUsername)
                        .email(email)
                        .password(passwordEncoder.encode(java.util.UUID.randomUUID().toString()))
                        .role("customer")
                        .status("active")
                        .build();
                user = userRepository.save(user);

                Customer customer = Customer.builder()
                        .user(user)
                        .fullName(fullName)
                        .tierId(1)
                        .build();
                customerRepository.save(customer);
            } catch (org.springframework.dao.DataIntegrityViolationException e) {
                user = userRepository.findByEmail(email)
                        .orElseThrow(() -> new BusinessException(
                                "Loi dong thoi khi dang nhap Google, vui long thu lai",
                                HttpStatus.CONFLICT));
            }
        }

        String token = jwtTokenProvider.generateToken(email, user.getId(), user.getPassword());
        return buildLoginResponse(token, user);
    }

    @Override
    @Transactional
    public void changePassword(Integer userId, String oldPassword, String newPassword) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException("Không tìm thấy người dùng", HttpStatus.NOT_FOUND));

        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            throw new BusinessException("Mật khẩu cũ không đúng", HttpStatus.BAD_REQUEST);
        }

        if (passwordEncoder.matches(newPassword, user.getPassword())) {
            throw new BusinessException("Mật khẩu mới phải khác mật khẩu cũ", HttpStatus.BAD_REQUEST);
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        refreshTokenService.deleteByUserId(user.getId());

        if (org.springframework.util.StringUtils.hasText(user.getEmail())) {
            mailService.sendPasswordChangedEmail(user.getEmail(), user.getUsername());
        }
    }

    @Override
    public void requestForgotPasswordOtp(String email, String requestIp) {
        String normalizedEmail = normalizeEmail(email);
        long startTime = System.currentTimeMillis();

        boolean userExists = userRepository.findByEmail(normalizedEmail).isPresent();

        if (userExists) {
            otpService.sendOtp(normalizedEmail, OtpService.PURPOSE_PASSWORD_RESET, requestIp);
        } else {
            // Chống Timing-based email enumeration bằng cách giả lập thời gian xử lý (DB queries + gửi email)
            long elapsed = System.currentTimeMillis() - startTime;
            long targetDelay = 1500 + secureRandom.nextInt(2000); // 1500ms - 3500ms

            if (elapsed < targetDelay) {
                try {
                    Thread.sleep(targetDelay - elapsed);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            }
        }
    }

    @Override
    @Transactional
    public void verifyAndResetPassword(String email, String otp, String newPassword) {
        String normalizedEmail = normalizeEmail(email);

        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new BusinessException("Khong tim thay nguoi dung", HttpStatus.NOT_FOUND));

        if (!otpService.isEmailVerified(normalizedEmail, OtpService.PURPOSE_PASSWORD_RESET)) {
            otpService.verifyOtp(normalizedEmail, otp.trim(), OtpService.PURPOSE_PASSWORD_RESET);
        }

        if (passwordEncoder.matches(newPassword, user.getPassword())) {
            throw new BusinessException("Mật khẩu mới phải khác mật khẩu cũ", HttpStatus.BAD_REQUEST);
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        refreshTokenService.deleteByUserId(user.getId());
        otpService.clearVerification(normalizedEmail, OtpService.PURPOSE_PASSWORD_RESET);

        if (org.springframework.util.StringUtils.hasText(user.getEmail())) {
            mailService.sendPasswordChangedEmail(user.getEmail(), user.getUsername());
        }
    }

    private LoginResponseDTO buildLoginResponse(String token, User user) {
        String fullName = "Unknown";
        Integer customerId = null;

        if ("customer".equalsIgnoreCase(user.getRole())) {
            Customer customer = customerRepository.findByUser_Id(user.getId()).orElse(null);
            if (customer != null) {
                fullName = customer.getFullName();
                customerId = customer.getCustomerId();
            }
        }

        String refreshToken = refreshTokenService.createRefreshToken(user.getId()).getToken();

        LoginResponseDTO.UserDto userDto = LoginResponseDTO.UserDto.builder()
                .userId(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(fullName)
                .role(user.getRole().toUpperCase())
                .customerId(customerId)
                .build();

        return LoginResponseDTO.builder()
                .accessToken(token)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .user(userDto)
                .build();
    }

    private String normalizePhone(String phone) {
        String trimmed = phone == null ? "" : phone.trim();
        if (trimmed.startsWith("0") && (trimmed.length() == 10 || trimmed.length() == 11)) {
            return "+84" + trimmed.substring(1);
        }
        return trimmed;
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }
}
