package com.autowash.backend.auth.service.impl;

import com.autowash.backend.auth.dto.LoginRequestDTO;
import com.autowash.backend.auth.dto.LoginResponseDTO;
import com.autowash.backend.auth.dto.RegisterRequestDTO;
import com.autowash.backend.auth.service.AuthService;
import com.autowash.backend.auth.service.OtpService;
import com.autowash.backend.auth.service.RefreshTokenService;
import com.autowash.backend.common.exception.BusinessException;
import com.autowash.backend.loyaltytier.repository.LoyaltyTierRepository;
import com.autowash.backend.security.CustomUserDetails;
import com.autowash.backend.security.JwtTokenProvider;
import com.autowash.backend.customer.repository.CustomerRepository;
import com.autowash.backend.customer.entity.Customer;
import com.autowash.backend.user.entity.User;
import com.autowash.backend.user.repository.UserRepository;
import org.springframework.http.*;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

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

    @org.springframework.beans.factory.annotation.Value("${supabase.url}")
    private String supabaseUrl;

    @org.springframework.beans.factory.annotation.Value("${supabase.anon-key}")
    private String supabaseAnonKey;

    public AuthServiceImpl(AuthenticationManager authenticationManager,
                           UserRepository userRepository,
                           PasswordEncoder passwordEncoder,
                           JwtTokenProvider jwtTokenProvider,
                           CustomerRepository customerRepository, OtpService otpService, LoyaltyTierRepository loyaltyTierRepository,RefreshTokenService refreshTokenService) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
        this.customerRepository = customerRepository;
        this.otpService = otpService;
        this.loyaltyTierRepository = loyaltyTierRepository;
        this.refreshTokenService =refreshTokenService;
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
                .tierId(1)
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

    @Override
    @Transactional
    public LoginResponseDTO loginWithGoogle(String supabaseToken) {
        //1.Dùng RestTemplate như 1 cái điện thoại để gọi cho Supabase
        RestTemplate restTemplate = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(supabaseToken);//đưa cái thẻ token(của gg) cho supabase kiểm tra
        headers.set("apikey", supabaseAnonKey);//đoc mật khẩu nhà

        HttpEntity<String> entity = new HttpEntity<>(headers);
        //header như là tem thư còn HttpEntity là thung bưu kiện , hành động này như là đem thư bỏ vào thùng
        Map<String, Object> body;
        //sau khi gửi hàng qua supabase thì nó sẽ response lại 1 cái gói hàng thì hành động này chuẩn bị 1 cái rỗ để hứng cái gói hàng đó

        try {
            //Đầu bên kia supabase trả lời:
            ResponseEntity<Map> supabaseResponse = restTemplate.exchange(
                                    supabaseUrl + "/auth/v1/user",
                    HttpMethod.GET,
                    entity,Map.class
            );
            body =supabaseResponse.getBody();
        }catch (Exception e){
            throw new BusinessException("Token Google không hợp lệ hoặc đã bị chỉnh sửa!!", HttpStatus.UNAUTHORIZED);
        }

        if(body == null || !body.containsKey("email")){
            throw new BusinessException("Không lấy được mail từ Google!",HttpStatus.BAD_REQUEST);
        }


        //trích xuất thông tin người dùng từ cái response của supabase
        String email = (String) body.get("email");
        Map<String,Object> metadata = (Map<String, Object>) body.get("user_metadata");
        String fullName = metadata != null && metadata.containsKey("full_name") ? (String) metadata.get("full_name"): "Khách hàng Google";

        //3.kiểm tra xem user này đã từng đăng nhập hệ thống bao giờ chưa ?
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            // Khách mới toanh -> Tự động tạo tài khoản DB cho họ
            String randomUsername = "gg_" + java.util.UUID.randomUUID().toString().substring(0, 8);

            user = User.builder()
                    .username(randomUsername)
                    .email(email)
                    .password(passwordEncoder.encode(java.util.UUID.randomUUID().toString())) // Mật khẩu ảo chống hack
                    .role("customer")
                    .status("active")
                    .build();
            user = userRepository.save(user);
            // Tạo luôn thông tin khách hàng (Customer)
            Customer customer = Customer.builder()
                    .user(user)
                    .fullName(fullName)
                    .tierId(1)
                    .build();
            customerRepository.save(customer);
        }
        // 4. In thẻ VIP và Thẻ thường
        String token = jwtTokenProvider.generateToken(email, user.getId());
        return buildLoginResponse(token, user);
    }


    private LoginResponseDTO buildLoginResponse(String token, User user) {
        String fullName = "Unknown";
        if ("customer".equalsIgnoreCase(user.getRole())) {
            fullName = customerRepository.findByUserId(user.getId())
                    .map(Customer::getFullName)
                    .orElse("Khách hàng");
        }
        //tạo ra cái vé VIP (Refresh token)
        String refreshToken = refreshTokenService.createRefreshToken(user.getId()).getToken();

        LoginResponseDTO.UserDto userDto=LoginResponseDTO.UserDto.builder()
                .userId(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(fullName)
                .role(user.getRole().toUpperCase())
                .build();

        return LoginResponseDTO.builder()
                .accessToken(token)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .user(userDto)
                .build();
    }
}