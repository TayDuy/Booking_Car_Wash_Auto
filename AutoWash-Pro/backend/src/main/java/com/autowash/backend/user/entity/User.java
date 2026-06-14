package com.autowash.backend.user.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

/**
 * Tài khoản đăng nhập dùng chung cho customer, employee, admin.
 * Map tới bảng "account" trong DB.
 * role phân quyền ở tầng application — không tách bảng để đơn giản hóa auth.
 */
@Entity
@EntityListeners(AuditingEntityListener.class)
@Table(name = "account")
@NoArgsConstructor
@AllArgsConstructor
@Data       // bao gồm @Getter, @Setter, @EqualsAndHashCode, @ToString, @RequiredArgsConstructor
@Builder
@ToString
public class User {

    /** PK — map tới cột user_id trong DB. Field tên "id" (không phải "userId")
     *  → Spring Data query phải dùng User_Id, không phải User_UserId. */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    private Integer id;

    /** Tên đăng nhập — UNIQUE toàn hệ thống. */
    @Column(name = "username", nullable = false, unique = true, length = 50)
    private String username;

    @Column(name = "email", length = 100)
    private String email;

    /** Lưu dạng hash (bcrypt) — không lưu plaintext. */
    @Column(name = "password_hash", nullable = false, length = 255)
    private String password;

    @Column(name = "phone", length = 15, unique = true)
    private String phone;

    /** active / locked / inactive — kiểm tra trước khi cho đăng nhập. */
    @Column(name = "status", nullable = false, length = 10)
    private String status = "active";

    /** customer / employee / admin — phân quyền ở tầng application. */
    @Column(name = "role", nullable = false, length = 10)
    private String role = "customer";

    /** Audit — set tự động khi INSERT, không cho phép update sau đó. */
    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}