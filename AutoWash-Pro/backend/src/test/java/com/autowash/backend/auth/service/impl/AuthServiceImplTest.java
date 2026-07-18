package com.autowash.backend.auth.service.impl;

import com.autowash.backend.auth.dto.LoginRequestDTO;
import com.autowash.backend.auth.dto.LoginResponseDTO;
import com.autowash.backend.auth.dto.RegisterRequestDTO;
import com.autowash.backend.auth.service.OtpService;
import com.autowash.backend.auth.entity.RefreshToken;
import com.autowash.backend.auth.service.RefreshTokenService;
import com.autowash.backend.common.exception.BusinessException;
import com.autowash.backend.customer.entity.Customer;
import com.autowash.backend.customer.repository.CustomerRepository;
import com.autowash.backend.loyaltytier.repository.LoyaltyTierRepository;
import com.autowash.backend.mail.service.MailService;
import com.autowash.backend.security.CustomUserDetails;
import com.autowash.backend.security.JwtTokenProvider;
import com.autowash.backend.user.entity.User;
import com.autowash.backend.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceImplTest {

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private OtpService otpService;

    @Mock
    private LoyaltyTierRepository loyaltyTierRepository;

    @Mock
    private RefreshTokenService refreshTokenService;

    @Mock
    private MailService mailService;

    @InjectMocks
    private AuthServiceImpl authService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(authService, "supabaseUrl", "http://localhost:9000");
        ReflectionTestUtils.setField(authService, "supabaseAnonKey", "test-key");
    }

    @Test
    void testLoginSuccess() {
        LoginRequestDTO request = new LoginRequestDTO();
        request.setUsername("testuser");
        request.setPassword("password123");

        User user = User.builder()
                .id(1)
                .username("testuser")
                .email("testuser@gmail.com")
                .role("customer")
                .status("active")
                .failedAttempts(0)
                .build();

        Authentication authentication = mock(Authentication.class);
        CustomUserDetails userDetails = mock(CustomUserDetails.class);
        RefreshToken mockRefreshToken = new RefreshToken();
        mockRefreshToken.setToken("mock-refresh-token");

        when(userRepository.findByEmailIgnoreCase(anyString())).thenReturn(Optional.empty());
        when(userRepository.findByUsernameIgnoreCase(anyString())).thenReturn(Optional.of(user));
        when(authenticationManager.authenticate(any())).thenReturn(authentication);
        when(authentication.getPrincipal()).thenReturn(userDetails);
        when(userDetails.getId()).thenReturn(1);
        when(userRepository.findById(1)).thenReturn(Optional.of(user));
        when(jwtTokenProvider.generateToken(authentication)).thenReturn("mock-access-token");
        when(refreshTokenService.createRefreshToken(1)).thenReturn(mockRefreshToken);

        Customer mockCustomer = Customer.builder()
                .customerId(10)
                .fullName("Test Customer")
                .build();
        when(customerRepository.findByUser_Id(1)).thenReturn(Optional.of(mockCustomer));

        LoginResponseDTO response = authService.login(request);

        assertNotNull(response);
        assertEquals("mock-access-token", response.getAccessToken());
        assertEquals("mock-refresh-token", response.getRefreshToken());
        assertEquals("testuser", response.getUser().getUsername());
        assertEquals(10, response.getUser().getCustomerId());
        verify(userRepository, times(1)).save(any());
    }

    @Test
    void testLoginFailThrowsLockoutException() {
        LoginRequestDTO request = new LoginRequestDTO();
        request.setUsername("testuser");
        request.setPassword("wrong-password");

        User user = User.builder()
                .id(1)
                .username("testuser")
                .email("testuser@gmail.com")
                .role("customer")
                .status("active")
                .failedAttempts(4) // 4 attempts, next fails lockouts
                .build();

        when(userRepository.findByEmailIgnoreCase(anyString())).thenReturn(Optional.empty());
        when(userRepository.findByUsernameIgnoreCase(anyString())).thenReturn(Optional.of(user));
        when(authenticationManager.authenticate(any())).thenThrow(new org.springframework.security.authentication.BadCredentialsException("Bad credentials"));

        BusinessException exception = assertThrows(BusinessException.class, () -> authService.login(request));
        assertTrue(exception.getMessage().contains("Tài khoản đã bị tạm khóa"));
        assertEquals(HttpStatus.BAD_REQUEST, exception.getHttpStatus());
        verify(userRepository, times(1)).save(any());
    }

    @Test
    void testRegisterSuccess() {
        RegisterRequestDTO request = new RegisterRequestDTO();
        request.setUsername("newuser");
        request.setEmail("newuser@gmail.com");
        request.setPassword("password123");
        request.setPhone("0912345678");
        request.setFullName("New User");

        when(userRepository.existsByEmailIgnoreCase(anyString())).thenReturn(false);
        when(userRepository.existsByUsernameIgnoreCase(anyString())).thenReturn(false);
        when(userRepository.existsByPhone(anyString())).thenReturn(false);
        when(otpService.isEmailVerified("newuser@gmail.com")).thenReturn(true);
        when(passwordEncoder.encode(anyString())).thenReturn("hashed-pwd");

        User savedUser = User.builder()
                .id(2)
                .username("newuser")
                .email("newuser@gmail.com")
                .role("customer")
                .status("active")
                .password("hashed-pwd")
                .build();
        when(userRepository.save(any(User.class))).thenReturn(savedUser);
        when(jwtTokenProvider.generateToken(anyString(), anyInt(), anyString())).thenReturn("mock-access-token");

        RefreshToken mockRefreshToken = new RefreshToken();
        mockRefreshToken.setToken("mock-refresh-token");
        when(refreshTokenService.createRefreshToken(anyInt())).thenReturn(mockRefreshToken);

        LoginResponseDTO response = authService.register(request);

        assertNotNull(response);
        assertEquals("mock-access-token", response.getAccessToken());
        verify(customerRepository, times(1)).save(any());
    }

    @Test
    void testRegisterUnverifiedEmailThrowsException() {
        RegisterRequestDTO request = new RegisterRequestDTO();
        request.setUsername("newuser");
        request.setEmail("newuser@gmail.com");
        request.setPassword("password123");
        request.setPhone("0912345678");

        when(userRepository.existsByEmailIgnoreCase(anyString())).thenReturn(false);
        when(userRepository.existsByUsernameIgnoreCase(anyString())).thenReturn(false);
        when(userRepository.existsByPhone(anyString())).thenReturn(false);
        when(otpService.isEmailVerified("newuser@gmail.com")).thenReturn(false);

        BusinessException exception = assertThrows(BusinessException.class, () -> authService.register(request));
        assertEquals("Email chua duoc xac minh OTP", exception.getMessage());
    }

    @Test
    void testChangePasswordSuccess() {
        User user = User.builder()
                .id(1)
                .username("testuser")
                .email("testuser@gmail.com")
                .password("old-hashed-password")
                .build();

        when(userRepository.findById(1)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("oldPassword", "old-hashed-password")).thenReturn(true);
        when(passwordEncoder.matches("newPassword", "old-hashed-password")).thenReturn(false);
        when(passwordEncoder.encode("newPassword")).thenReturn("new-hashed-password");

        authService.changePassword(1, "oldPassword", "newPassword");

        assertEquals("new-hashed-password", user.getPassword());
        verify(userRepository, times(1)).save(user);
        verify(refreshTokenService, times(1)).deleteByUserId(1);
        verify(mailService, times(1)).sendPasswordChangedEmail("testuser@gmail.com", "testuser");
    }

    @Test
    void testChangePasswordWrongOldPasswordThrowsException() {
        User user = User.builder()
                .id(1)
                .password("old-hashed-password")
                .build();

        when(userRepository.findById(1)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrongOldPassword", "old-hashed-password")).thenReturn(false);

        BusinessException exception = assertThrows(BusinessException.class,
                () -> authService.changePassword(1, "wrongOldPassword", "newPassword"));
        assertEquals("Mật khẩu cũ không đúng", exception.getMessage());
    }
}
