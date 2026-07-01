package com.autowash.backend.mail.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

public interface MailService {
    /**
     * Gửi email mã OTP (Đăng ký, Quên mật khẩu...)
     */
    void sendOtpEmail(String toEmail, String otpCode, String purpose);

    /**
     * Gửi email xác nhận đặt lịch rửa xe thành công
     */
    void sendBookingConfirmationEmail(
            String toEmail,
            String customerName,
            String bookingCode,
            String branchName,
            String branchAddress,
            String serviceName,
            LocalDate slotDate,
            LocalTime startTime,
            LocalTime endTime,
            BigDecimal totalPrice
    );
}
