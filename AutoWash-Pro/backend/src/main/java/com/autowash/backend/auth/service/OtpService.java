package com.autowash.backend.auth.service;

public interface OtpService {

    String PURPOSE_GENERAL = "GENERAL";
    String PURPOSE_PASSWORD_RESET = "PASSWORD_RESET";

    void sendOtp(String phone);

    void sendOtp(String phone, String purpose, String requestIp);

    boolean verifyOtp(String phone, String otp);

    boolean verifyOtp(String phone, String otp, String purpose);

    boolean isPhoneVerified(String phone);

    void clearVerification(String phone);

    void clearVerification(String phone, String purpose);
}