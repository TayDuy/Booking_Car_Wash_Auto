package com.autowash.backend;

import com.autowash.backend.user.entity.User;
import com.autowash.backend.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

@SpringBootTest
class BackendApplicationTests {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AuthenticationManager authenticationManager;

    @Test
    void testAuthDirectly() {
        System.out.println("=== START PASSWORD UPDATE ===");
        String encoded = passwordEncoder.encode("123456");
        
        userRepository.findByUsernameOrEmail("admin.minh", "minh.admin@autowash.vn").ifPresent(user -> {
            user.setPassword(encoded);
            userRepository.save(user);
            System.out.println("Updated admin.minh password to encoded '123456': " + encoded);
        });

        userRepository.findByUsernameOrEmail("staff.tanpd", "tan.pd@autowash.vn").ifPresent(user -> {
            user.setPassword(encoded);
            userRepository.save(user);
            System.out.println("Updated staff.tanpd password to encoded '123456': " + encoded);
        });

        userRepository.findByUsernameOrEmail("khoavh", "khoavh@gmail.com").ifPresent(user -> {
            user.setPassword(encoded);
            userRepository.save(user);
            System.out.println("Updated khoavh password to encoded '123456': " + encoded);
        });
        System.out.println("=== END PASSWORD UPDATE ===");
    }
}
