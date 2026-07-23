package com.autowash.backend.user.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@EntityListeners(AuditingEntityListener.class)
@Table(name = "account")
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    private Integer id;

    @Column(name = "username", nullable = false, unique = true, length = 50)
    private String username;

    @Column(name = "email", length = 100)
    private String email;

    @Column(name = "password_hash", nullable = false, length = 255)
    private String password;

    @Column(name = "phone", length = 15, unique = true)
    private String phone;

    @Column(name = "status", nullable = false, length = 10)
    @Builder.Default
    private String status = "active";

    @Column(name = "role", nullable = false, length = 10)
    @Builder.Default
    private String role = "customer";

    @Column(name = "failed_attempts")
    @Builder.Default
    private Integer failedAttempts = 0;

    @Column(name = "lockout_end_time")
    private LocalDateTime lockoutEndTime;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public Integer getId() { return id; }
    public String getUsername() { return username; }
    public String getEmail() { return email; }
    public String getPassword() { return password; }
    public String getPhone() { return phone; }
    public String getStatus() { return status; }
    public String getRole() { return role; }
    public Integer getFailedAttempts() { return failedAttempts; }
    public LocalDateTime getLockoutEndTime() { return lockoutEndTime; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}