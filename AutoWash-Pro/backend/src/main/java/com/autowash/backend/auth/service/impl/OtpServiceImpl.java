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
    private static final int OTP_MAX_SENDS_PER_EMAIL = 5;
    private static final int OTP_MAX_SENDS_PER_IP = 20;
    private static final int OTP_SEND_WINDOW_MINUTES = 15;

    private final OtpRepository otpRepository;
    private final PasswordEncoder passwordEncoder;
    private final com.autowash.backend.mail.service.MailService mailService;
    private final SecureRandom secureRandom = new SecureRandom();

    @Value("${app.otp.log-code:false}")
    private boolean logOtpCode;

    public OtpServiceImpl(OtpRepository otpRepository, PasswordEncoder passwordEncoder, com.autowash.backend.mail.service.MailService mailService) {
        this.otpRepository = otpRepository;
        this.passwordEncoder = passwordEncoder;
        this.mailService = mailService;
    }

    @Override
    @Transactional
    public void sendOtp(String email) {
        sendOtp(email, PURPOSE_GENERAL, null);
    }

    @Override
    @Transactional
    public void sendOtp(String email, String purpose, String requestIp) {
        String normalizedEmail = normalizeEmail(email);
        String normalizedPurpose = normalizePurpose(purpose);
        checkSendRateLimit(normalizedEmail, normalizedPurpose, requestIp);

        String otpCode = String.format("%06d", secureRandom.nextInt(1_000_000));
        OtpVerification otp = OtpVerification.builder()
                .email(normalizedEmail)
                .otpCode(passwordEncoder.encode(otpCode))
                .purpose(normalizedPurpose)
                .verified(false)
                .attemptCount(0)
                .requestIp(requestIp)
                .expiresAt(LocalDateTime.now().plusMinutes(5))
                .build();

        otpRepository.save(otp);
        mailService.sendOtpEmail(normalizedEmail, otpCode, normalizedPurpose);

        if (logOtpCode) {
            System.out.println("========================================");
            System.out.println("OTP code for " + normalizedEmail + ": " + otpCode);
            System.out.println("========================================");
        }
    }

    @Override
    @Transactional
    public boolean verifyOtp(String email, String otp) {
        return verifyOtp(email, otp, PURPOSE_GENERAL);
    }

    @Override
    @Transactional
    public boolean verifyOtp(String email, String otp, String purpose) {
        String normalizedEmail = normalizeEmail(email);
        String normalizedPurpose = normalizePurpose(purpose);

        OtpVerification record = otpRepository
                .findTopByEmailAndPurposeAndVerifiedFalseOrderByCreatedAtDesc(normalizedEmail, normalizedPurpose)
                .orElseThrow(() -> new BusinessException("Khong tim thay ma OTP cho email nay"));

        if (record.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BusinessException("Ma OTP da het han, vui long gui lai");
        }

        int attempts = record.getAttemptCount() != null ? record.getAttemptCount() : 0;
        if (attempts >= OTP_MAX_ATTEMPTS) {
            throw new BusinessException("Ma OTP da bi khoa vi nhap sai qua nhieu lan", HttpStatus.TOO_MANY_REQUESTS);
        }

        if (!passwordEncoder.matches(otp, record.getOtpCode())) {
            record.setAttemptCount(attempts + 1);
            otpRepository.save(record);

            if ((attempts + 1) >= OTP_MAX_ATTEMPTS) {
                throw new BusinessException("Ma OTP da bi khoa vi nhap sai qua nhieu lan", HttpStatus.TOO_MANY_REQUESTS);
            }

            throw new BusinessException("Ma OTP khong dung");
        }

        record.setVerified(true);
        otpRepository.save(record);
        return true;
    }

    @Override
    public boolean isEmailVerified(String email) {
        return otpRepository.existsByEmailAndPurposeAndVerifiedTrue(normalizeEmail(email), PURPOSE_GENERAL);
    }

    @Override
    public boolean isEmailVerified(String email, String purpose) {
        return otpRepository.existsByEmailAndPurposeAndVerifiedTrue(normalizeEmail(email), normalizePurpose(purpose));
    }

    @Override
    @Transactional
    public void clearVerification(String email) {
        clearVerification(email, PURPOSE_GENERAL);
    }

    @Override
    @Transactional
    public void clearVerification(String email, String purpose) {
        otpRepository.deleteByEmailAndPurposeAndVerifiedTrue(normalizeEmail(email), normalizePurpose(purpose));
    }

    private void checkSendRateLimit(String email, String purpose, String requestIp) {
        LocalDateTime since = LocalDateTime.now().minusMinutes(OTP_SEND_WINDOW_MINUTES);

        if (otpRepository.countByEmailAndPurposeAndCreatedAtAfter(email, purpose, since) >= OTP_MAX_SENDS_PER_EMAIL) {
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

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }
}
