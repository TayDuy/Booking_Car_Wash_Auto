package com.autowash.backend.user.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "account")
@NoArgsConstructor
@AllArgsConstructor
@Data //co toan bo get set roi
@ToString
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "userid")
    private Integer id;

    @Column(name = "username", nullable = false, unique = true, length = 50)
    private String username;

    @Column(name = "email", length = 100)
    private String email;

    @Column(name = "passwordhash", nullable = false, length = 255)
    private String password;

    @Column(name = "phone", length = 15, unique = true)
    private String phone;

    @Column(name = "status", nullable = false, length = 10)
    private String status = "active";

    @Column(name = "role", nullable = false, length = 10)
    private String role = "customer";

    @Column(name = "createdat", nullable = false, updatable = false)
    private LocalDateTime createdAt;


    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}