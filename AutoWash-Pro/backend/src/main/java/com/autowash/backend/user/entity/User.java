package com.autowash.backend.user.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "Account")
@NoArgsConstructor
@AllArgsConstructor
@Data //co toan bo get set roi
@ToString
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "UserID")
    private Integer id;

    @Column(name = "Username", nullable = false, unique = true, length = 50)
    private String username;

    @Column(name = "Email", length = 100)
    private String email;

    @Column(name = "PasswordHash", nullable = false, length = 255)
    private String password;

    @Column(name = "Phone", length = 15, unique = true)
    private String phone;

    @Column(name = "Status", nullable = false, length = 10)
    private String status = "active";

    @Column(name = "Role", nullable = false, length = 10)
    private String role = "customer";

    @Column(name = "CreatedAt", nullable = false, updatable = false)
    private LocalDateTime createdAt;


    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}