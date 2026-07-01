package com.autowash.backend.otp.repository;

import com.autowash.backend.otp.entity.OtpVerification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.Optional;

public interface OtpRepository extends JpaRepository<OtpVerification, Integer> {

    Optional<OtpVerification> findTopByPhoneAndVerifiedFalseOrderByCreatedAtDesc(String phone);

    Optional<OtpVerification> findTopByPhoneAndPurposeAndVerifiedFalseOrderByCreatedAtDesc(String phone, String purpose);

    boolean existsByPhoneAndVerifiedTrue(String phone);

    boolean existsByPhoneAndPurposeAndVerifiedTrue(String phone, String purpose);

    void deleteByPhoneAndVerifiedTrue(String phone);

    void deleteByPhoneAndPurposeAndVerifiedTrue(String phone, String purpose);

    long countByPhoneAndPurposeAndCreatedAtAfter(String phone, String purpose, LocalDateTime createdAt);

    long countByRequestIpAndPurposeAndCreatedAtAfter(String requestIp, String purpose, LocalDateTime createdAt);
}
