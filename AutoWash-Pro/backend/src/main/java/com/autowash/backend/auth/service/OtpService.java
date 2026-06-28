package com.autowash.backend.auth.service;

public interface OtpService {
    void sendOtp(String phone);//gửi otp
    boolean verifyOtp(String phone, String otp);//kiểm tra otp
    boolean isPhoneVerified(String phone);//kiểm tra phone đã verify chưa

    void clearVerification(String phone);
}
