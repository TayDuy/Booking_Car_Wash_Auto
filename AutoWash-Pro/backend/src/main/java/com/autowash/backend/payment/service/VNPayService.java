package com.autowash.backend.payment.service;

import com.google.zxing.WriterException;
import jakarta.servlet.http.HttpServletRequest;

import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.util.Map;

public interface VNPayService {

    /**
     * Tạo URL thanh toán VNPAY kèm chữ ký hợp lệ.
     *
     * @param request   HttpServletRequest hiện tại (dùng để lấy IP khách hàng)
     * @param amount    Số tiền thanh toán (đơn vị VND, chưa nhân 100)
     * @param orderInfo Mô tả đơn hàng
     * @param txnRef    Mã giao dịch duy nhất (nên dùng bookingId/paymentId thật thay vì timestamp)
     * @return URL đầy đủ để redirect hoặc encode thành QR
     */
    String createPaymentUrl(HttpServletRequest request, long amount, String orderInfo, String txnRef)
            throws UnsupportedEncodingException;

    /**
     * Sinh ảnh QR (PNG dạng byte[]) từ một chuỗi nội dung (thường là paymentUrl).
     */
    byte[] generateQRCode(String text, int width, int height) throws WriterException, IOException;

    /**
     * Xác thực chữ ký trả về từ VNPAY (dùng cho vnp_ReturnUrl / IPN).
     *
     * @param fields toàn bộ query param VNPAY gửi về (đã loại bỏ vnp_SecureHash, vnp_SecureHashType)
     * @param receivedHash giá trị vnp_SecureHash nhận được từ VNPAY
     * @return true nếu chữ ký hợp lệ
     */
    boolean validateSignature(Map<String, String> fields, String receivedHash)
            throws UnsupportedEncodingException;
}