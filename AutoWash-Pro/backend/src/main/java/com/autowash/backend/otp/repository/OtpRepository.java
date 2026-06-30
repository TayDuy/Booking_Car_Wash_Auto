package com.autowash.backend.otp.repository;

import com.autowash.backend.otp.entity.OtpVerification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.Optional;

public interface OtpRepository extends JpaRepository<OtpVerification, Integer> {

    Optional<OtpVerification> findTopByEmailAndVerifiedFalseOrderByCreatedAtDesc(String email);

    Optional<OtpVerification> findTopByEmailAndPurposeAndVerifiedFalseOrderByCreatedAtDesc(String email, String purpose);

    boolean existsByEmailAndVerifiedTrue(String email);

    boolean existsByEmailAndPurposeAndVerifiedTrue(String email, String purpose);

    void deleteByEmailAndVerifiedTrue(String email);

    void deleteByEmailAndPurposeAndVerifiedTrue(String email, String purpose);

    long countByEmailAndPurposeAndCreatedAtAfter(String email, String purpose, LocalDateTime createdAt);

    long countByRequestIpAndPurposeAndCreatedAtAfter(String requestIp, String purpose, LocalDateTime createdAt);
}
