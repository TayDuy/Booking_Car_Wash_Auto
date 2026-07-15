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

    /**
     * Gửi email cảnh báo khi mật khẩu tài khoản bị thay đổi
     */
    void sendPasswordChangedEmail(String toEmail, String username);

    /**
     * Gửi email xác nhận đặt lịch đã bị hủy
     */
    void sendBookingCancelledEmail(
            String toEmail,
            String customerName,
            String bookingCode,
            String reason
    );

    /**
     * Gửi email xác nhận thanh toán thành công
     */
    void sendPaymentSuccessEmail(
            String toEmail,
            String customerName,
            String bookingCode,
            String paymentMethod,
            BigDecimal finalAmount
    );

    /**
     * Gửi email thông báo thanh toán thất bại
     */
    void sendPaymentFailedEmail(
            String toEmail,
            String customerName,
            String bookingCode,
            String reason
    );

    /**
     * Gửi email thông báo thăng hạng thành viên
     */
    void sendTierUpgradedEmail(
            String toEmail,
            String customerName,
            String newTierName
    );

    /**
     * Gửi email thông báo hạ hạng thành viên
     */
    void sendTierDowngradedEmail(
            String toEmail,
            String customerName,
            String newTierName
    );

    /**
     * Gửi email xác nhận đổi điểm thưởng lấy phần thưởng
     */
    void sendPointsRedeemedEmail(
            String toEmail,
            String customerName,
            String rewardName,
            Integer pointsUsed
    );

    /**
     * Gửi email thông báo khuyến mãi/voucher mới
     */
    void sendNewPromotionEmail(
            String toEmail,
            String customerName,
            String promotionName,
            String promotionDescription
    );
}