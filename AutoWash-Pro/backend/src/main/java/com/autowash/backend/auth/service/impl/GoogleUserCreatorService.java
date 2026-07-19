package com.autowash.backend.auth.service.impl;

import com.autowash.backend.common.exception.BusinessException;
import com.autowash.backend.customer.entity.Customer;
import com.autowash.backend.customer.repository.CustomerRepository;
import com.autowash.backend.user.entity.User;
import com.autowash.backend.user.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import static com.autowash.backend.notification.entity.Notification.NotificationChannel.email;

/**
 * Bean riêng để tạo user Google mới trong TRANSACTION ĐỘC LẬP (REQUIRES_NEW).
 *
 * LÝ DO phải tách ra bean riêng (không để trong AuthServiceImpl):
 * Spring @Transactional hoạt động thông qua AOP proxy. Khi một method trong
 * cùng class gọi method @Transactional khác trong cùng class đó bằng "this.method()",
 * Spring proxy bị bypass — annotation REQUIRES_NEW không có hiệu lực, cả hai
 * method chạy chung 1 transaction.
 *
 * Hậu quả: nếu DataIntegrityViolationException xảy ra (2 request đồng thời
 * tạo user cùng email), transaction chính bị đánh dấu "aborted" (PostgreSQL),
 * mọi query sau đó (kể cả findByEmail trong khối catch) đều fail → server trả
 * 500 thay vì xử lý êm → frontend treo.
 *
 * Tách ra bean riêng → Spring tạo proxy cho bean này → REQUIRES_NEW hoạt động
 * đúng: chỉ transaction phụ bị rollback, transaction chính vẫn sạch.
 */
@Service
public class GoogleUserCreatorService {

    private static final org.slf4j.Logger log =
            org.slf4j.LoggerFactory.getLogger(GoogleUserCreatorService.class);

    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;
    private final PasswordEncoder passwordEncoder;

    public GoogleUserCreatorService(UserRepository userRepository,
                                    CustomerRepository customerRepository,
                                    PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.customerRepository = customerRepository;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Tìm hoặc tạo user mới cho đăng nhập Google, chạy trong TRANSACTION RIÊNG.
     * Nếu 2 request đồng thời cùng insert cùng email, chỉ 1 thành công;
     * request còn lại bắt DataIntegrityViolationException, rollback transaction
     * phụ, rồi findByEmail() để trả về user đã được tạo bởi request kia.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public User findOrCreateGoogleUser(String email, String fullName) {
        try {
            String randomUsername = "gg_" + java.util.UUID.randomUUID().toString().substring(0, 8);

            User user = User.builder()
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

            log.info("Tao moi user Google thanh cong: {}", email);
            return user;

        } catch (org.springframework.dao.DataIntegrityViolationException e) {
        log.warn("Trung lap email khi tao user Google (co the do request dong thoi): {}", email);

        for (int attempt = 0; attempt < 3; attempt++) {
            java.util.Optional<User> existing = userRepository.findByEmailIgnoreCase(email);
            if (existing.isPresent()) {
                return existing.get();
            }
            try {
                Thread.sleep(50);
            } catch (InterruptedException ie) {
                Thread.currentThread().interrupt();
                break;
            }
        }

        throw new BusinessException(
                "Loi dong thoi khi dang nhap Google, vui long thu lai",
                HttpStatus.CONFLICT);
    }
    }
}
