package com.autowash.backend.payment.config;

/**
 * Cấu hình các thông số kết nối VNPAY Sandbox.
 * Khuyến nghị: chuyển các giá trị TmnCode / HashSecret sang application.properties
 * và inject bằng @Value thay vì hard-code, đặc biệt khi lên production.
 */
public class VNPayConfig {

    // URL cổng thanh toán VNPAY (Sandbox)
    public static final String vnp_PayUrl = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";

    // URL VNPAY sẽ redirect về sau khi khách thanh toán xong
    public static final String vnp_ReturnUrl = "http://localhost:8080/api/v1/payments/vnpay-return";

    // Mã website do VNPAY cấp khi đăng ký sandbox
    public static final String vnp_TmnCode = "E1FVK51M";

    // Chuỗi bí mật dùng để tạo/xác thực chữ ký HMAC-SHA512
    public static final String vnp_HashSecret = "CR3OTU5E08AHX4YVYG7IT906FP2X0G7J";

    // API tra cứu/hoàn tiền giao dịch (nếu cần dùng sau này)
    public static final String vnp_ApiUrl = "https://sandbox.vnpayment.vn/merchant_webapi/api/transaction";

    public static final String vnp_Version = "2.1.0";
    public static final String vnp_Command = "pay";
}