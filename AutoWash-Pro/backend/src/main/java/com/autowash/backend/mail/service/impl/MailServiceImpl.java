package com.autowash.backend.mail.service.impl;

import com.autowash.backend.mail.service.MailService;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.util.HtmlUtils;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

@Service
@RequiredArgsConstructor
@Slf4j
public class MailServiceImpl implements MailService {

    private final JavaMailSender mailSender;

    @org.springframework.beans.factory.annotation.Value("${spring.mail.username}")
    private String mailFrom;

    @org.springframework.beans.factory.annotation.Value("${app.otp.log-code:false}")
    private boolean logOtpCode;

    @Override
    @Async("mailTaskExecutor")
    public void sendOtpEmail(String toEmail, String otpCode, String purpose) {
        if (logOtpCode) {
            log.info("Bắt đầu gửi email OTP đến {} - MÃ OTP THẬT: {}", toEmail, otpCode);
        } else {
            log.info("Bắt đầu gửi email OTP đến {}", toEmail);
        }
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(toEmail);
            helper.setSubject("Mã xác thực OTP - WashFlow Pro");
            helper.setFrom(mailFrom);

            String purposeLabel = switch (purpose.toUpperCase()) {
                case "PASSWORD_RESET" -> "đặt lại mật khẩu";
                default -> "xác thực tài khoản";
            };

            String htmlContent = String.format(
                "<!DOCTYPE html><html><head><meta charset=\"utf-8\">" +
                "<style>" +
                "body{margin:0;padding:0;background-color:#f4f7fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif}" +
                ".container{max-width:480px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.08)}" +
                ".header{background:#003d9b;padding:24px;text-align:center}" +
                ".header h1{margin:0;color:#fff;font-size:20px;font-weight:700}" +
                ".body{padding:32px 24px;text-align:center}" +
                ".otp-code{font-size:36px;font-weight:800;letter-spacing:8px;color:#003d9b;background:#eef2ff;padding:16px 24px;border-radius:8px;display:inline-block;margin:16px 0}" +
                ".footer{background:#f8fafc;padding:16px 24px;text-align:center;font-size:12px;color:#94a3b8}" +
                "</style></head><body>" +
                "<div class=\"container\">" +
                "<div class=\"header\"><h1>Mã xác thực OTP</h1></div>" +
                "<div class=\"body\">" +
                "<p style=\"font-size:16px;color:#334155;margin-bottom:8px\">Xin chào,</p>" +
                "<p style=\"font-size:14px;color:#64748b;margin-bottom:4px\">Mã OTP dùng để <strong>%s</strong> của bạn là:</p>" +
                "<div class=\"otp-code\">%s</div>" +
                "<p style=\"font-size:13px;color:#94a3b8;margin-top:16px\">Mã có hiệu lực trong <strong>5 phút</strong>. Không chia sẻ mã này với bất kỳ ai.</p>" +
                "</div>" +
                "<div class=\"footer\">WashFlow Pro &bull; Hệ thống chăm sóc xe tự động</div>" +
                "</div></body></html>",
                purposeLabel, otpCode
            );

            helper.setText(htmlContent, true);
            mailSender.send(message);
            log.info("Đã gửi thành công email OTP đến {}", toEmail);
        } catch (Exception e) {
            log.error("Lỗi khi gửi email OTP đến {}: {}", toEmail, e.getMessage(), e);
            throw new com.autowash.backend.common.exception.BusinessException(
                    "Gửi email OTP thất bại. Vui lòng kiểm tra lại địa chỉ email.",
                    org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @Override
    @Async("mailTaskExecutor")
    public void sendBookingConfirmationEmail(
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
    ) {
        log.info("Bắt đầu gửi email xác nhận đặt lịch bất đồng bộ đến {}", toEmail);
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(toEmail);
            helper.setSubject("Xác nhận đặt lịch thành công - WashFlow Pro");
            helper.setFrom(mailFrom);

            String safeCustomerName = HtmlUtils.htmlEscape(customerName);
            String safeBranchName = HtmlUtils.htmlEscape(branchName);
            String safeBranchAddress = HtmlUtils.htmlEscape(branchAddress);
            String safeServiceName = HtmlUtils.htmlEscape(serviceName);
            String safeBookingCode = HtmlUtils.htmlEscape(bookingCode);

            DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
            DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("HH:mm");
            String formattedDate = slotDate.format(dateFormatter);
            String formattedStartTime = startTime.format(timeFormatter);
            String formattedEndTime = endTime.format(timeFormatter);

            NumberFormat currencyFormatter = NumberFormat.getCurrencyInstance(new Locale("vi", "VN"));
            String formattedPrice = currencyFormatter.format(totalPrice);

            String htmlContent = String.format(
                "<!DOCTYPE html><html><head><meta charset=\"utf-8\">" +
                "<style>body{margin:0;padding:0;background-color:#f4f7fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif}" +
                ".container{max-width:480px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.08)}" +
                ".header{background:#003d9b;padding:24px;text-align:center}" +
                ".header h1{margin:0;color:#fff;font-size:20px;font-weight:700}" +
                ".body{padding:32px 24px;text-align:center}" +
                ".detail{background:#f8fafc;border-radius:8px;padding:16px;margin:16px 0;text-align:left}" +
                ".detail dt{font-size:12px;color:#94a3b8;margin-top:8px}" +
                ".detail dd{font-size:14px;font-weight:600;color:#1e293b;margin:2px 0 0 0}" +
                ".footer{background:#f8fafc;padding:16px 24px;text-align:center;font-size:12px;color:#94a3b8}" +
                "</style></head><body>" +
                "<div class=\"container\">" +
                "<div class=\"header\"><h1>Đặt lịch thành công</h1></div>" +
                "<div class=\"body\">" +
                "<p style=\"font-size:16px;color:#334155\">Xin chào %s,</p>" +
                "<p style=\"font-size:14px;color:#64748b\">Lịch đặt của bạn đã được xác nhận thành công. Chi tiết giao dịch:</p>" +
                "<div class=\"detail\">" +
                "<dl><dt>Mã đặt lịch</dt><dd>%s</dd>" +
                "<dt>Chi nhánh</dt><dd>%s (%s)</dd>" +
                "<dt>Dịch vụ</dt><dd>%s</dd>" +
                "<dt>Thời gian</dt><dd>%s %s - %s</dd>" +
                "<dt>Tổng tiền</dt><dd style=\"color:#003d9b;font-size:16px\">%s</dd></dl>" +
                "</div>" +
                "<p style=\"font-size:13px;color:#94a3b8;margin-top:16px\">Cảm ơn bạn đã lựa chọn WashFlow Pro.</p>" +
                "</div>" +
                "<div class=\"footer\">WashFlow Pro &bull; Hệ thống chăm sóc xe tự động</div>" +
                "</div></body></html>",
                safeCustomerName, safeBookingCode, safeBranchName, safeBranchAddress, safeServiceName,
                formattedDate, formattedStartTime, formattedEndTime, formattedPrice
            );

            helper.setText(htmlContent, true);
            mailSender.send(message);
            log.info("Đã gửi thành công email xác nhận đặt lịch đến {}", toEmail);
        } catch (Exception e) {
            log.error("Lỗi khi gửi email xác nhận đặt lịch đến {}: {}", toEmail, e.getMessage(), e);
        }
    }

    @Override
    @Async("mailTaskExecutor")
    public void sendPasswordChangedEmail(String toEmail, String username) {
        log.info("Bắt đầu gửi email thông báo đổi mật khẩu đến {}", toEmail);
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(toEmail);
            message.setSubject("Mật khẩu tài khoản của bạn đã được thay đổi - WashFlow Pro");
            String content = String.format(
                    "Xin chào %s,\n\nMật khẩu tài khoản WashFlow Pro của bạn vừa được thay đổi thành công.\n" +
                            "Nếu không phải bạn thực hiện thay đổi này, vui lòng liên hệ ngay với bộ phận hỗ trợ của chúng tôi qua hotline 1900 8888 hoặc phản hồi email này để khóa tài khoản khẩn cấp.\n\n" +
                            "Trân trọng,\nWashFlow Pro Team",
                    username
            );
            message.setText(content);
            message.setFrom(mailFrom);
            mailSender.send(message);
            log.info("Đã gửi thành công email thông báo đổi mật khẩu đến {}", toEmail);
        } catch (Exception e) {
            log.error("Lỗi khi gửi email thông báo đổi mật khẩu đến {}: {}", toEmail, e.getMessage(), e);
        }
    }

    @Override
    @Async("mailTaskExecutor")
    public void sendBookingCancelledEmail(String toEmail, String customerName, String bookingCode, String reason) {
        log.info("Bắt đầu gửi email thông báo hủy đặt lịch đến {}", toEmail);
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(toEmail);
            helper.setSubject("Đặt lịch đã bị hủy - WashFlow Pro");
            helper.setFrom(mailFrom);

            String safeCustomerName = HtmlUtils.htmlEscape(customerName);
            String safeBookingCode = HtmlUtils.htmlEscape(bookingCode);
            String safeReason = reason != null ? HtmlUtils.htmlEscape(reason) : "Không có lý do";

            String htmlContent = String.format(
                "<!DOCTYPE html><html><head><meta charset=\"utf-8\">" +
                "<style>body{margin:0;padding:0;background-color:#f4f7fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif}" +
                ".container{max-width:480px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.08)}" +
                ".header{background:#dc2626;padding:24px;text-align:center}" +
                ".header h1{margin:0;color:#fff;font-size:20px;font-weight:700}" +
                ".body{padding:32px 24px;text-align:center}" +
                ".detail{background:#fef2f2;border-radius:8px;padding:16px;margin:16px 0;text-align:left}" +
                ".detail dt{font-size:12px;color:#94a3b8;margin-top:8px}" +
                ".detail dd{font-size:14px;font-weight:600;color:#1e293b;margin:2px 0 0 0}" +
                ".footer{background:#f8fafc;padding:16px 24px;text-align:center;font-size:12px;color:#94a3b8}" +
                "</style></head><body>" +
                "<div class=\"container\">" +
                "<div class=\"header\"><h1>Đặt lịch đã bị hủy</h1></div>" +
                "<div class=\"body\">" +
                "<p style=\"font-size:16px;color:#334155\">Xin chào %s,</p>" +
                "<p style=\"font-size:14px;color:#64748b\">Đặt lịch của bạn đã bị hủy.</p>" +
                "<div class=\"detail\">" +
                "<dl><dt>Mã đặt lịch</dt><dd>%s</dd>" +
                "<dt>Lý do</dt><dd>%s</dd></dl>" +
                "</div>" +
                "<p style=\"font-size:13px;color:#94a3b8;margin-top:16px\">Vui lòng liên hệ hotline 1900 8888 nếu cần hỗ trợ.</p>" +
                "</div>" +
                "<div class=\"footer\">WashFlow Pro &bull; Hệ thống chăm sóc xe tự động</div>" +
                "</div></body></html>",
                safeCustomerName, safeBookingCode, safeReason
            );

            helper.setText(htmlContent, true);
            mailSender.send(message);
            log.info("Đã gửi thành công email thông báo hủy đặt lịch đến {}", toEmail);
        } catch (Exception e) {
            log.error("Lỗi khi gửi email thông báo hủy đặt lịch đến {}: {}", toEmail, e.getMessage(), e);
        }
    }

    @Override
    @Async("mailTaskExecutor")
    public void sendPaymentSuccessEmail(String toEmail, String customerName, String bookingCode, String paymentMethod, BigDecimal finalAmount) {
        log.info("Bắt đầu gửi email xác nhận thanh toán thành công đến {}", toEmail);
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(toEmail);
            helper.setSubject("Thanh toán thành công - WashFlow Pro");
            helper.setFrom(mailFrom);

            NumberFormat currencyFormatter = NumberFormat.getCurrencyInstance(new Locale("vi", "VN"));
            String formattedAmount = currencyFormatter.format(finalAmount);
            String safeCustomerName = HtmlUtils.htmlEscape(customerName);
            String safeBookingCode = HtmlUtils.htmlEscape(bookingCode);
            String safePaymentMethod = HtmlUtils.htmlEscape(paymentMethod);

            String htmlContent = String.format(
                "<!DOCTYPE html><html><head><meta charset=\"utf-8\">" +
                "<style>body{margin:0;padding:0;background-color:#f4f7fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif}" +
                ".container{max-width:480px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.08)}" +
                ".header{background:#059669;padding:24px;text-align:center}" +
                ".header h1{margin:0;color:#fff;font-size:20px;font-weight:700}" +
                ".body{padding:32px 24px;text-align:center}" +
                ".amount{font-size:32px;font-weight:800;color:#059669;padding:16px 0}" +
                ".detail{background:#f0fdf4;border-radius:8px;padding:16px;margin:16px 0;text-align:left}" +
                ".detail dt{font-size:12px;color:#94a3b8;margin-top:8px}" +
                ".detail dd{font-size:14px;font-weight:600;color:#1e293b;margin:2px 0 0 0}" +
                ".footer{background:#f8fafc;padding:16px 24px;text-align:center;font-size:12px;color:#94a3b8}" +
                "</style></head><body>" +
                "<div class=\"container\">" +
                "<div class=\"header\"><h1>Thanh toán thành công</h1></div>" +
                "<div class=\"body\">" +
                "<p style=\"font-size:16px;color:#334155\">Xin chào %s,</p>" +
                "<p style=\"font-size:14px;color:#64748b\">Cảm ơn bạn đã thanh toán. Giao dịch của bạn đã được xử lý thành công.</p>" +
                "<div class=\"amount\">%s</div>" +
                "<div class=\"detail\">" +
                "<dl><dt>Mã đặt lịch</dt><dd>%s</dd>" +
                "<dt>Phương thức thanh toán</dt><dd>%s</dd></dl>" +
                "</div>" +
                "<p style=\"font-size:13px;color:#94a3b8;margin-top:16px\">Mọi thắc mắc xin liên hệ hotline 1900 8888.</p>" +
                "</div>" +
                "<div class=\"footer\">WashFlow Pro &bull; Hệ thống chăm sóc xe tự động</div>" +
                "</div></body></html>",
                safeCustomerName, formattedAmount, safeBookingCode, safePaymentMethod
            );

            helper.setText(htmlContent, true);
            mailSender.send(message);
            log.info("Đã gửi thành công email xác nhận thanh toán đến {}", toEmail);
        } catch (Exception e) {
            log.error("Lỗi khi gửi email xác nhận thanh toán đến {}: {}", toEmail, e.getMessage(), e);
        }
    }

    @Override
    @Async("mailTaskExecutor")
    public void sendPaymentFailedEmail(String toEmail, String customerName, String bookingCode, String reason) {
        log.info("Bắt đầu gửi email thông báo thanh toán thất bại đến {}", toEmail);
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(toEmail);
            helper.setSubject("Thanh toán không thành công - WashFlow Pro");
            helper.setFrom(mailFrom);

            String safeCustomerName = HtmlUtils.htmlEscape(customerName);
            String safeBookingCode = HtmlUtils.htmlEscape(bookingCode);
            String safeReason = reason != null ? HtmlUtils.htmlEscape(reason) : "Không có thông tin";

            String htmlContent = String.format(
                "<!DOCTYPE html><html><head><meta charset=\"utf-8\">" +
                "<style>body{margin:0;padding:0;background-color:#f4f7fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif}" +
                ".container{max-width:480px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.08)}" +
                ".header{background:#dc2626;padding:24px;text-align:center}" +
                ".header h1{margin:0;color:#fff;font-size:20px;font-weight:700}" +
                ".body{padding:32px 24px;text-align:center}" +
                ".detail{background:#fef2f2;border-radius:8px;padding:16px;margin:16px 0;text-align:left}" +
                ".detail dt{font-size:12px;color:#94a3b8;margin-top:8px}" +
                ".detail dd{font-size:14px;font-weight:600;color:#1e293b;margin:2px 0 0 0}" +
                ".footer{background:#f8fafc;padding:16px 24px;text-align:center;font-size:12px;color:#94a3b8}" +
                "</style></head><body>" +
                "<div class=\"container\">" +
                "<div class=\"header\"><h1>Thanh toán không thành công</h1></div>" +
                "<div class=\"body\">" +
                "<p style=\"font-size:16px;color:#334155\">Xin chào %s,</p>" +
                "<p style=\"font-size:14px;color:#64748b\">Rất tiếc, thanh toán cho lịch đặt của bạn không thành công.</p>" +
                "<div class=\"detail\">" +
                "<dl><dt>Mã đặt lịch</dt><dd>%s</dd>" +
                "<dt>Lý do</dt><dd>%s</dd></dl>" +
                "</div>" +
                "<p style=\"font-size:13px;color:#94a3b8;margin-top:16px\">Vui lòng kiểm tra lại phương thức thanh toán hoặc liên hệ hotline 1900 8888.</p>" +
                "</div>" +
                "<div class=\"footer\">WashFlow Pro &bull; Hệ thống chăm sóc xe tự động</div>" +
                "</div></body></html>",
                safeCustomerName, safeBookingCode, safeReason
            );

            helper.setText(htmlContent, true);
            mailSender.send(message);
            log.info("Đã gửi thành công email thông báo thanh toán thất bại đến {}", toEmail);
        } catch (Exception e) {
            log.error("Lỗi khi gửi email thông báo thanh toán thất bại đến {}: {}", toEmail, e.getMessage(), e);
        }
    }

    @Override
    @Async("mailTaskExecutor")
    public void sendTierUpgradedEmail(String toEmail, String customerName, String newTierName) {
        log.info("Bắt đầu gửi email thông báo thăng hạng thành viên đến {}", toEmail);
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(toEmail);
            message.setSubject("Chúc mừng bạn đã thăng hạng thành viên - WashFlow Pro");
            String content = String.format(
                    "Xin chào %s,\n\nChúc mừng! Bạn vừa được thăng hạng thành viên lên hạng \"%s\".\n" +
                            "Hãy đăng nhập ứng dụng để khám phá các ưu đãi mới dành riêng cho hạng thành viên của bạn.\n\n" +
                            "Trân trọng,\nWashFlow Pro Team",
                    customerName, newTierName
            );
            message.setText(content);
            message.setFrom(mailFrom);
            mailSender.send(message);
            log.info("Đã gửi thành công email thông báo thăng hạng thành viên đến {}", toEmail);
        } catch (Exception e) {
            log.error("Lỗi khi gửi email thông báo thăng hạng thành viên đến {}: {}", toEmail, e.getMessage(), e);
        }
    }

    @Override
    @Async("mailTaskExecutor")
    public void sendTierDowngradedEmail(String toEmail, String customerName, String newTierName) {
        log.info("Bắt đầu gửi email thông báo hạ hạng thành viên đến {}", toEmail);
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(toEmail);
            message.setSubject("Thông báo thay đổi hạng thành viên - WashFlow Pro");
            String content = String.format(
                    "Xin chào %s,\n\nHạng thành viên của bạn vừa được điều chỉnh xuống hạng \"%s\" " +
                            "do mức chi tiêu/điểm tích lũy trong kỳ đánh giá gần nhất chưa đạt yêu cầu duy trì hạng cũ.\n" +
                            "Hãy tiếp tục sử dụng dịch vụ để nhanh chóng lấy lại hạng cao hơn.\n\n" +
                            "Trân trọng,\nWashFlow Pro Team",
                    customerName, newTierName
            );
            message.setText(content);
            message.setFrom(mailFrom);
            mailSender.send(message);
            log.info("Đã gửi thành công email thông báo hạ hạng thành viên đến {}", toEmail);
        } catch (Exception e) {
            log.error("Lỗi khi gửi email thông báo hạ hạng thành viên đến {}: {}", toEmail, e.getMessage(), e);
        }
    }

    @Override
    @Async("mailTaskExecutor")
    public void sendPointsRedeemedEmail(
            String toEmail,
            String customerName,
            String rewardName,
            Integer pointsUsed
    ) {
        log.info("Bắt đầu gửi email xác nhận đổi điểm thưởng đến {}", toEmail);
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(toEmail);
            message.setSubject("Xác nhận đổi điểm thưởng thành công - WashFlow Pro");
            String content = String.format(
                    "Xin chào %s,\n\nBạn vừa đổi thành công %d điểm thưởng để nhận: \"%s\".\n" +
                            "Vui lòng kiểm tra mục Ưu đãi của tôi trong ứng dụng để sử dụng phần thưởng.\n\n" +
                            "Trân trọng,\nWashFlow Pro Team",
                    customerName, pointsUsed, rewardName
            );
            message.setText(content);
            message.setFrom(mailFrom);
            mailSender.send(message);
            log.info("Đã gửi thành công email xác nhận đổi điểm thưởng đến {}", toEmail);
        } catch (Exception e) {
            log.error("Lỗi khi gửi email xác nhận đổi điểm thưởng đến {}: {}", toEmail, e.getMessage(), e);
        }
    }

    @Override
    @Async("mailTaskExecutor")
    public void sendNewPromotionEmail(
            String toEmail,
            String customerName,
            String promotionName,
            String promotionDescription
    ) {
        log.info("Bắt đầu gửi email thông báo khuyến mãi mới đến {}", toEmail);
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(toEmail);
            message.setSubject("Khuyến mãi mới dành cho bạn - WashFlow Pro");
            String content = String.format(
                    "Xin chào %s,\n\nWashFlow Pro vừa ra mắt khuyến mãi mới: \"%s\".\n%s\n\n" +
                            "Truy cập ứng dụng ngay để áp dụng ưu đãi cho lần đặt lịch tiếp theo của bạn!\n\n" +
                            "Trân trọng,\nWashFlow Pro Team",
                    customerName, promotionName,
                    (promotionDescription == null || promotionDescription.isBlank())
                            ? "" : promotionDescription
            );
            message.setText(content);
            message.setFrom(mailFrom);
            mailSender.send(message);
            log.info("Đã gửi thành công email thông báo khuyến mãi mới đến {}", toEmail);
        } catch (Exception e) {
            log.error("Lỗi khi gửi email thông báo khuyến mãi mới đến {}: {}", toEmail, e.getMessage(), e);
        }
    }
}
