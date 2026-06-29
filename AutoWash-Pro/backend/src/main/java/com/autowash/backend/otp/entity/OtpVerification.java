package com.autowash.backend.otp.entity;


import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@EntityListeners(AuditingEntityListener.class)
@Table(name="otp_verification")
@NoArgsConstructor
@AllArgsConstructor
@Data
@Builder
public class OtpVerification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, length = 15)
    private String phone;

    @Column(name = "otp_code", nullable = false, length = 100)
    private String otpCode;

    @Builder.Default
    @Column(nullable = false, length = 30, columnDefinition = "varchar(30) default 'GENERAL' not null")
    private String purpose = "GENERAL";

    @Builder.Default
    @Column(nullable = false)
    private Boolean verified = false;

    @Builder.Default
    @Column(name = "attempt_count", nullable = false, columnDefinition = "integer default 0 not null")
    private Integer attemptCount = 0;

    @Column(name = "request_ip", length = 45)
    private String requestIp;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

}
