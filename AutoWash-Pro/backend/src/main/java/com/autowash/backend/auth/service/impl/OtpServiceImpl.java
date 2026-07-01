package com.autowash.backend.auth.service.impl;

import com.autowash.backend.auth.service.OtpService;
import com.autowash.backend.common.exception.BusinessException;
import com.autowash.backend.otp.entity.OtpVerification;
import com.autowash.backend.otp.repository.OtpRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.security.SecureRandom;
import java.time.LocalDateTime;

@Service
public class OtpServiceImpl implements OtpService {

    private static final int OTP_MAX_ATTEMPTS = 5;
    private static final int OTP_MAX_SENDS_PER_PHONE = 5;
    private static final int OTP_MAX_SENDS_PER_IP = 20;
    private static final int OTP_SEND_WINDOW_MINUTES = 15;

    private final OtpRepository otpRepository;
    private final PasswordEncoder passwordEncoder;
    private final SecureRandom secureRandom = new SecureRandom();

    @Value("${app.otp.log-code:false}")
    private boolean logOtpCode;

    public OtpServiceImpl(OtpRepository otpRepository, PasswordEncoder passwordEncoder) {
        this.otpRepository = otpRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void sendOtp(String phone) {
        sendOtp(phone, PURPOSE_GENERAL, null);
    }

    @Override
    @Transactional
    public void sendOtp(String phone, String purpose, String requestIp) {
        String normalizedPhone = normalizePhone(phone);
        String normalizedPurpose = normalizePurpose(purpose);
        checkSendRateLimit(normalizedPhone, normalizedPurpose, requestIp);

        String otpCode = String.format("%06d", secureRandom.nextInt(1_000_000));
        OtpVerification otp = OtpVerification.builder()
                .phone(normalizedPhone)
                .otpCode(passwordEncoder.encode(otpCode))
                .purpose(normalizedPurpose)
                .verified(false)
                .attemptCount(0)
                .requestIp(requestIp)
                .expiresAt(LocalDateTime.now().plusMinutes(5))
                .build();

        otpRepository.save(otp);

        System.out.println("========================================");
        System.out.println("[MOCK SMS] send to: " + normalizedPhone + ", purpose: " + normalizedPurpose);
        if (logOtpCode) {
            System.out.println("OTP code: " + otpCode);
        }
        System.out.println("Expires after 5 minutes");
        System.out.println("========================================");
    }

    @Override
    @Transactional
    public boolean verifyOtp(String phone, String otp) {
        return verifyOtp(phone, otp, PURPOSE_GENERAL);
    }

    @Override
    @Transactional
    public boolean verifyOtp(String phone, String otp, String purpose) {
        String normalizedPhone = normalizePhone(phone);
        String normalizedPurpose = normalizePurpose(purpose);

        OtpVerification record = otpRepository
                .findTopByPhoneAndPurposeAndVerifiedFalseOrderByCreatedAtDesc(normalizedPhone, normalizedPurpose)
                .orElseThrow(() -> new BusinessException("Khong tim thay ma OTP cho so nay"));

        if (record.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BusinessException("Ma OTP da het han, vui long gui lai");
        }

        if (record.getAttemptCount() >= OTP_MAX_ATTEMPTS) {
            throw new BusinessException("Ma OTP da bi khoa vi nhap sai qua nhieu lan", HttpStatus.TOO_MANY_REQUESTS);
        }

        if (!passwordEncoder.matches(otp, record.getOtpCode())) {
            record.setAttemptCount(record.getAttemptCount() + 1);
            otpRepository.save(record);

            if (record.getAttemptCount() >= OTP_MAX_ATTEMPTS) {
                throw new BusinessException("Ma OTP da bi khoa vi nhap sai qua nhieu lan", HttpStatus.TOO_MANY_REQUESTS);
            }

            throw new BusinessException("Ma OTP khong dung");
        }

        record.setVerified(true);
        otpRepository.save(record);
        return true;
    }

    @Override
    public boolean isPhoneVerified(String phone) {
        return otpRepository.existsByPhoneAndPurposeAndVerifiedTrue(normalizePhone(phone), PURPOSE_GENERAL);
    }

    @Override
    @Transactional
    public void clearVerification(String phone) {
        clearVerification(phone, PURPOSE_GENERAL);
    }

    @Override
    @Transactional
    public void clearVerification(String phone, String purpose) {
        otpRepository.deleteByPhoneAndPurposeAndVerifiedTrue(normalizePhone(phone), normalizePurpose(purpose));
    }

    private void checkSendRateLimit(String phone, String purpose, String requestIp) {
        LocalDateTime since = LocalDateTime.now().minusMinutes(OTP_SEND_WINDOW_MINUTES);

        if (otpRepository.countByPhoneAndPurposeAndCreatedAtAfter(phone, purpose, since) >= OTP_MAX_SENDS_PER_PHONE) {
            throw new BusinessException("Ban da yeu cau OTP qua nhieu lan, vui long thu lai sau", HttpStatus.TOO_MANY_REQUESTS);
        }

        if (StringUtils.hasText(requestIp)
                && otpRepository.countByRequestIpAndPurposeAndCreatedAtAfter(requestIp, purpose, since) >= OTP_MAX_SENDS_PER_IP) {
            throw new BusinessException("Dia chi IP da yeu cau OTP qua nhieu lan, vui long thu lai sau", HttpStatus.TOO_MANY_REQUESTS);
        }
    }

    private String normalizePurpose(String purpose) {
        return StringUtils.hasText(purpose) ? purpose.trim().toUpperCase() : PURPOSE_GENERAL;
    }

    private String normalizePhone(String phone) {
        String trimmed = phone == null ? "" : phone.trim();
        if (trimmed.startsWith("0") && trimmed.length() == 10) {
            return "+84" + trimmed.substring(1);
        }
        return trimmed;
    }
}