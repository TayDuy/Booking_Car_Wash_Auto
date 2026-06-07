package com.autowash.backend.user.controller;

import com.autowash.backend.user.entity.User;
import com.autowash.backend.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/dev")
public class DevController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @GetMapping("/hash-passwords")
    public ResponseEntity<String> hashAllPlaintextPasswords() {
        List<User> users = userRepository.findAll();
        int count = 0;
        
        for (User user : users) {
            String currentPassword = user.getPassword();
            // Nếu mật khẩu chưa được mã hóa (Mã BCrypt luôn bắt đầu bằng $2a$)
            if (currentPassword != null && !currentPassword.startsWith("$2a$")) {
                user.setPassword(passwordEncoder.encode(currentPassword));
                userRepository.save(user);
                count++;
            }
        }
        return ResponseEntity.ok("Đã chuyển đổi thành công " + count + " mật khẩu sang định dạng BCrypt!");
    }

    /**
     * Reset TẤT CẢ mật khẩu về "123456" (đã mã hóa BCrypt)
     * CHỈ DÙNG ĐỂ TEST - XÓA NGAY KHI LÊN PRODUCTION!
     */
    @GetMapping("/reset-passwords")
    public ResponseEntity<String> resetAllPasswords() {
        List<User> users = userRepository.findAll();
        String defaultPassword = passwordEncoder.encode("123456");

        for (User user : users) {
            user.setPassword(defaultPassword);
            userRepository.save(user);
        }
        return ResponseEntity.ok("Đã reset toàn bộ " + users.size() + " tài khoản về mật khẩu mặc định: 123456");
    }
}
