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

    @Override
    @Async
    public void sendOtpEmail(String toEmail, String otpCode, String purpose) {
        log.info("Bắt đầu gửi email OTP bất đồng bộ đến {} - MÃ OTP THẬT: {}", toEmail, otpCode);
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(toEmail);
            message.setSubject("Mã xác thực OTP - WashFlow Pro");
            String content = String.format(
                    "Xin chào,\n\nMã xác thực OTP của bạn là: %s\n" +
                    "Mã này được sử dụng cho mục đích: %s.\n" +
                    "Thời gian hiệu lực là 5 phút. Vui lòng không chia sẻ mã này với bất kỳ ai.\n\n" +
                    "Trân trọng,\nWashFlow Pro Team",
                    otpCode, purpose
            );
            message.setText(content);
            message.setFrom("no-reply@washflow.pro");
            mailSender.send(message);
            log.info("Đã gửi thành công email OTP đến {}", toEmail);
        } catch (Exception e) {
            log.error("Lỗi khi gửi email OTP đến {}: {}", toEmail, e.getMessage(), e);
        }
    }

    @Override
    @Async
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
            helper.setFrom("no-reply@washflow.pro");

            // Định dạng ngày: "Thứ Ba, 30/06/2026"
            DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("EEEE, dd/MM/yyyy", new Locale("vi", "VN"));
            String formattedDate = slotDate.format(dateFormatter);
            if (formattedDate.length() > 0) {
                formattedDate = Character.toUpperCase(formattedDate.charAt(0)) + formattedDate.substring(1);
            }

            // Định dạng giờ: "10:00 - 12:00"
            String formattedTime = String.format("%s - %s",
                    startTime.toString().substring(0, 5),
                    endTime.toString().substring(0, 5)
            );

            // Định dạng giá tiền: "100.000 đ"
            NumberFormat currencyFormatter = NumberFormat.getCurrencyInstance(new Locale("vi", "VN"));
            String formattedPrice = currencyFormatter.format(totalPrice);

            String ctaUrl = "http://localhost:5173/bookings";

            String htmlContent = String.format(
                "<!DOCTYPE html>" +
                "<html>" +
                "<head>" +
                "  <meta charset=\"utf-8\">" +
                "  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">" +
                "  <meta name=\"color-scheme\" content=\"light\">" +
                "  <style>" +
                "    body { margin: 0; padding: 0; background-color: #F8F9FA; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; }" +
                "    table { border-spacing: 0; border-collapse: collapse; }" +
                "    td { padding: 0; }" +
                "    img { border: 0; }" +
                "  </style>" +
                "</head>" +
                "<body style=\"margin: 0; padding: 0; background-color: #F8F9FA; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;\">" +
                "  <table width=\"100%%\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\" style=\"background-color: #F8F9FA; padding: 24px 0;\">" +
                "    <tr>" +
                "      <td align=\"center\">" +
                "        <!-- Khối chứa chính (Rộng 500px trên desktop, 100%% trên di động) -->" +
                "        <table width=\"500\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\" style=\"max-width: 500px; width: 100%%;\">" +
                "          " +
                "          <!-- Logo Brand -->" +
                "          <tr>" +
                "            <td align=\"center\" style=\"padding-bottom: 24px;\">" +
                "              <table border=\"0\" cellspacing=\"0\" cellpadding=\"0\">" +
                "                <tr>" +
                "                  <td valign=\"middle\" style=\"padding-right: 8px;\">" +
                "                    <img src=\"cid:logo\" alt=\"Logo\" height=\"32\" style=\"height: 32px; width: auto; display: block; border: 0;\">" +
                "                  </td>" +
                "                  <td valign=\"middle\" style=\"font-size: 22px; font-weight: 800; color: #003d9b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 32px;\">" +
                "                    WashFlow Pro" +
                "                  </td>" +
                "                </tr>" +
                "              </table>" +
                "            </td>" +
                "          </tr>" +
                "          " +
                "          <!-- Khối Card chính -->" +
                "          <tr>" +
                "            <td style=\"background-color: #FFFFFF; border-radius: 12px; padding: 32px 24px; border: 1px solid #E2E8F0; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);\">" +
                "              " +
                "              <!-- ĐỈNH KIM TỰ THÁP: Hero Section -->" +
                "              <table width=\"100%%\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\">" +
                "                <tr>" +
                "                  <td align=\"center\" style=\"padding-bottom: 8px;\">" +
                "                    <span style=\"font-size: 32px;\">✅</span>" +
                "                  </td>" +
                "                </tr>" +
                "                <tr>" +
                "                  <td align=\"center\" style=\"font-size: 20px; font-weight: 800; color: #1A202C; text-transform: uppercase; padding-bottom: 8px; letter-spacing: 0.5px;\">" +
                "                    Đặt lịch thành công" +
                "                  </td>" +
                "                </tr>" +
                "                <tr>" +
                "                  <td align=\"center\" style=\"font-size: 14px; color: #4A5568; line-height: 1.5; padding-bottom: 24px; text-align: center;\">" +
                "                    Chào %s, yêu cầu chăm sóc xe của bạn đã được xác nhận và giữ chỗ thành công." +
                "                  </td>" +
                "                </tr>" +
                "              </table>" +
                "              " +
                "              <!-- THÂN KIM TỰ THÁP: Core Details Card -->" +
                "              <table width=\"100%%\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\" style=\"background-color: #F8F9FA; border-radius: 8px; border: 1px solid #EDF2F7; padding: 20px; margin-bottom: 24px;\">" +
                "                <!-- Thời gian (To nhất, đậm nhất) -->" +
                "                <tr>" +
                "                  <td align=\"center\" style=\"font-size: 28px; font-weight: 800; color: #003d9b; line-height: 1.2;\">" +
                "                    %s" +
                "                  </td>" +
                "                </tr>" +
                "                <tr>" +
                "                  <td align=\"center\" style=\"font-size: 15px; font-weight: 600; color: #4A5568; padding-top: 4px; padding-bottom: 16px; border-bottom: 1px dashed #CBD5E0;\">" +
                "                    %s" +
                "                  </td>" +
                "                </tr>" +
                "                " +
                "                <!-- Địa điểm -->" +
                "                <tr>" +
                "                  <td style=\"padding-top: 16px;\">" +
                "                    <table width=\"100%%\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\">" +
                "                      <tr>" +
                "                        <td style=\"font-size: 14px; font-weight: 700; color: #2D3748; padding-bottom: 4px;\">" +
                "                          📍 %s" +
                "                        </td>" +
                "                      </tr>" +
                "                      <tr>" +
                "                        <td style=\"font-size: 12px; color: #718096; line-height: 1.4;\">" +
                "                          %s" +
                "                        </td>" +
                "                      </tr>" +
                "                    </table>" +
                "                  </td>" +
                "                </tr>" +
                "              </table>" +
                "              " +
                "              <!-- Tóm tắt thanh toán & dịch vụ -->" +
                "              <table width=\"100%%\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\" style=\"padding-bottom: 24px; border-bottom: 1px solid #EDF2F7; margin-bottom: 24px;\">" +
                "                <tr>" +
                "                  <td style=\"font-size: 13px; color: #718096; padding-bottom: 8px;\">Gói dịch vụ</td>" +
                "                  <td align=\"right\" style=\"font-size: 13px; font-weight: 700; color: #2D3748; padding-bottom: 8px;\">%s</td>" +
                "                </tr>" +
                "                <tr>" +
                "                  <td style=\"font-size: 14px; font-weight: 700; color: #2D3748;\">Tổng thanh toán</td>" +
                "                  <td align=\"right\" style=\"font-size: 16px; font-weight: 800; color: #e53e3e;\">%s</td>" +
                "                </tr>" +
                "              </table>" +
                "              " +
                "              <!-- ĐÁY KIM TỰ THÁP: Call to Action -->" +
                "              <table width=\"100%%\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\">" +
                "                <tr>" +
                "                  <td align=\"center\" style=\"padding-bottom: 20px;\">" +
                "                    <table border=\"0\" cellspacing=\"0\" cellpadding=\"0\">" +
                "                      <tr>" +
                "                        <td align=\"center\" style=\"background-color: #003d9b; border-radius: 6px;\">" +
                "                          <a href=\"%s\" target=\"_blank\" style=\"display: inline-block; padding: 12px 32px; font-size: 14px; font-weight: 700; color: #FFFFFF; text-decoration: none; border-radius: 6px; border: 1px solid #003d9b;\">" +
                "                            Xem chi tiết đặt lịch" +
                "                          </a>" +
                "                        </td>" +
                "                      </tr>" +
                "                    </table>" +
                "                  </td>" +
                "                </tr>" +
                "                " +
                "                <!-- Mã lịch & Ghi chú nhỏ bên dưới -->" +
                "                <tr>" +
                "                  <td align=\"center\" style=\"font-size: 12px; color: #A0AEC0;\">" +
                "                    Mã đặt lịch: <span style=\"font-weight: 600; color: #4A5568;\">%s</span>" +
                "                  </td>" +
                "                </tr>" +
                "              </table>" +
                "              " +
                "            </td>" +
                "          </tr>" +
                "          " +
                "          <!-- Footer nhỏ -->" +
                "          <tr>" +
                "            <td align=\"center\" style=\"padding-top: 24px; font-size: 11px; color: #A0AEC0; line-height: 1.5; text-align: center;\">" +
                "              Hệ thống chăm sóc xe tự động chuyên nghiệp WashFlow Pro.<br>" +
                "              Hotline hỗ trợ: 1900 8888. Email: support@washflow.pro" +
                "            </td>" +
                "          </tr>" +
                "          " +
                "        </table>" +
                "      </td>" +
                "    </tr>" +
                "  </table>" +
                "</body>" +
                "</html>",
                customerName,
                formattedTime,
                formattedDate,
                branchName,
                branchAddress,
                serviceName,
                formattedPrice,
                ctaUrl,
                bookingCode
            );

            helper.setText(htmlContent, true);
            helper.addInline("logo", new ClassPathResource("logo.png"));
            
            mailSender.send(message);
            log.info("Đã gửi thành công email xác nhận đặt lịch đến {}", toEmail);
        } catch (Exception e) {
            log.error("Lỗi khi gửi email xác nhận đặt lịch đến {}: {}", toEmail, e.getMessage(), e);
        }
    }
}
