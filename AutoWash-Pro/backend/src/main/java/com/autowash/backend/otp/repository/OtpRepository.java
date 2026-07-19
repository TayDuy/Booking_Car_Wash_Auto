package com.autowash.backend.otp.repository;

import com.autowash.backend.otp.entity.OtpVerification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Optional;

public interface OtpRepository extends JpaRepository<OtpVerification, Integer> {

    Optional<OtpVerification> findTopByEmailAndVerifiedFalseOrderByCreatedAtDesc(String email);

    Optional<OtpVerification> findTopByEmailAndPurposeAndVerifiedFalseOrderByCreatedAtDesc(String email, String purpose);

    Optional<OtpVerification> findTopByEmailAndPurposeAndVerifiedFalseAndExpiresAtAfterOrderByCreatedAtDesc(String email, String purpose, LocalDateTime now);

    boolean existsByEmailAndVerifiedTrue(String email);

    boolean existsByEmailAndPurposeAndVerifiedTrue(String email, String purpose);

    void deleteByEmailAndVerifiedTrue(String email);

    void deleteByEmailAndPurposeAndVerifiedTrue(String email, String purpose);

    long countByEmailAndPurposeAndCreatedAtAfter(String email, String purpose, LocalDateTime createdAt);

    long countByRequestIpAndPurposeAndCreatedAtAfter(String requestIp, String purpose, LocalDateTime createdAt);

    @Modifying
    @Query("UPDATE OtpVerification o SET o.expiresAt = :now WHERE o.email = :email AND o.purpose = :purpose AND o.verified = false")
    void expirePreviousOtps(@Param("email") String email, @Param("purpose") String purpose, @Param("now") LocalDateTime now);
}