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

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(AuthServiceImpl.class);

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
                           RefreshTokenService refreshTokenService) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
        this.customerRepository = customerRepository;
        this.otpService = otpService;
        this.loyaltyTierRepository = loyaltyTierRepository;
        this.refreshTokenService = refreshTokenService;
    }

    @Override
    @Transactional
    public LoginResponseDTO login(LoginRequestDTO request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getUsername().trim().toLowerCase(),
                        request.getPassword()
                )
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);

        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        User user = userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new BusinessException("Khong tim thay nguoi dung", HttpStatus.NOT_FOUND));

        String token = jwtTokenProvider.generateToken(authentication);
        return buildLoginResponse(token, user);
    }

    @Override
    @Transactional
    public LoginResponseDTO register(RegisterRequestDTO request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();
        String normalizedPhone = normalizePhone(request.getPhone());

        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new BusinessException("Email '" + normalizedEmail + "' da duoc su dung");
        }

        if (userRepository.existsByUsername(request.getUsername())) {
            throw new BusinessException("Tai khoan '" + request.getUsername() + "' da duoc su dung");
        }

        if (userRepository.existsByPhone(normalizedPhone)) {
            throw new BusinessException("So dien thoai '" + normalizedPhone + "' da duoc su dung");
        }

        if (!otpService.isPhoneVerified(normalizedPhone)) {
            throw new BusinessException("So dien thoai chua duoc xac minh OTP");
        }

        User newUser = User.builder()
                .username(request.getUsername())
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

        String token = jwtTokenProvider.generateToken(savedUser.getEmail(), savedUser.getId());
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

        String token = jwtTokenProvider.generateToken(email, user.getId());
        return buildLoginResponse(token, user);
    }

    @Override
    public void requestForgotPasswordOtp(String phone, String requestIp) {
        String normalizedPhone = normalizePhone(phone);

        if (findUserByPhone(normalizedPhone).isEmpty()) {
            return;
        }

        otpService.sendOtp(normalizedPhone, OtpService.PURPOSE_PASSWORD_RESET, requestIp);
    }

    @Override
    @Transactional
    public void verifyAndResetPassword(String phone, String otp, String newPassword) {
        String normalizedPhone = normalizePhone(phone);

        User user = findUserByPhone(normalizedPhone)
                .orElseThrow(() -> new BusinessException("Khong tim thay nguoi dung", HttpStatus.NOT_FOUND));

        otpService.verifyOtp(normalizedPhone, otp.trim(), OtpService.PURPOSE_PASSWORD_RESET);

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        refreshTokenService.deleteByUserId(user.getId());
        otpService.clearVerification(normalizedPhone, OtpService.PURPOSE_PASSWORD_RESET);
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

    private Optional<User> findUserByPhone(String phone) {
        if (phone == null || phone.trim().isEmpty()) {
            return Optional.empty();
        }
        String normalizedPhone = normalizePhone(phone.trim());

        Optional<User> user = userRepository.findByPhone(normalizedPhone);
        if (user.isPresent()) {
            return user;
        }

        if (normalizedPhone.startsWith("+84") && normalizedPhone.length() == 12) {
            String legacyFormat = "0" + normalizedPhone.substring(3);
            if (!legacyFormat.equals(phone.trim())) {
                user = userRepository.findByPhone(legacyFormat);
                if (user.isPresent()) {
                    return user;
                }
            }
        }

        return userRepository.findByPhone(phone.trim());
    }

    private String normalizePhone(String phone) {
        String trimmed = phone == null ? "" : phone.trim();
        if (trimmed.startsWith("0") && trimmed.length() == 10) {
            return "+84" + trimmed.substring(1);
        }
        return trimmed;
    }
}