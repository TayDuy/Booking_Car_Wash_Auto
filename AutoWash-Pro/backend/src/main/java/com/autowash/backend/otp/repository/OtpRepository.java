package com.autowash.backend.otp.repository;

import com.autowash.backend.otp.entity.OtpVerification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface OtpRepository extends JpaRepository<OtpVerification, Integer> {
    //tìm otp mới nhất của 1 số phone (chưa verify)
    Optional<OtpVerification> findTopByPhoneAndVerifiedFalseOrderByCreatedAtDesc(String phone);

    //kiểm tra phone đã verify chưa
    boolean existsByPhoneAndVerifiedTrue(String phone);

}
