package com.autowash.backend.auth.service;

public interface OtpService {

    String PURPOSE_GENERAL = "GENERAL";
    String PURPOSE_PASSWORD_RESET = "PASSWORD_RESET";

    void sendOtp(String email);

    void sendOtp(String email, String purpose, String requestIp);

    boolean verifyOtp(String email, String otp);

    boolean verifyOtp(String email, String otp, String purpose);

    boolean isEmailVerified(String email);

    void clearVerification(String email);

    void clearVerification(String email, String purpose);
}
