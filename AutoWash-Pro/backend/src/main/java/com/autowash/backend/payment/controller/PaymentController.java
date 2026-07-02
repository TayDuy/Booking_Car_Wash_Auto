package com.autowash.backend.payment.controller;

import com.autowash.backend.payment.dto.*;
import com.autowash.backend.payment.entity.Payment.PaymentStatus;
import com.autowash.backend.payment.service.PaymentService;
import com.autowash.backend.payment.service.VNPayService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Enumeration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * PaymentController — REST API cho nghiệp vụ thanh toán (FR-5).
 *
 * Base path: /api/v1/payments
 *
 * Endpoints:
 *   POST   /                        → tạo payment sau khi booking completed
 *   PATCH  /{id}/status             → cập nhật trạng thái (unpaid→paid/cancelled)
 *   GET    /{id}                    → xem chi tiết payment
 *   GET    /booking/{bookingId}     → xem payment theo bookingId
 *   GET    /?status={status}        → lọc danh sách theo status (admin)
 *   GET    /{id}/vnpay-qr           → sinh QR thanh toán VNPAY cho payment đã tạo
 *   GET    /vnpay-return            → VNPAY redirect về sau khi khách thanh toán xong
 *   GET    /vnpay-ipn               → VNPAY server gọi server-to-server xác nhận kết quả thanh toán
 */
@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;
    private final VNPayService vnPayService;

    /**
     * Tạo payment cho booking đã completed.
     * Client truyền bookingId, paymentMethod và optionally promotionId/rewardId.
     * Service tự tính originalAmount từ booking_detail — không nhận từ client.
     */
    @PostMapping
    public ResponseEntity<PaymentResponseDTO> create(
            @Valid @RequestBody PaymentCreateRequestDTO request) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(paymentService.createPayment(request));
    }

    /**
     * Cập nhật trạng thái payment.
     * Khi status → paid: service tự set paidAt và trigger loyalty earn (FR-7).
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<PaymentResponseDTO> updateStatus(
            @PathVariable Integer id,
            @Valid @RequestBody PaymentUpdateRequestDTO request) {
        return ResponseEntity.ok(paymentService.updateStatus(id, request));
    }

    /**
     * Lấy chi tiết payment theo paymentId.
     * Dùng khi client đã biết paymentId (VD: từ response của create).
     */
    @GetMapping("/{id}")
    public ResponseEntity<PaymentResponseDTO> getById(@PathVariable Integer id) {
        return ResponseEntity.ok(paymentService.getById(id));
    }

    /**
     * Lấy payment theo bookingId.
     * Dùng khi client chỉ biết bookingId — tránh phải lưu paymentId riêng.
     */
    @GetMapping("/booking/{bookingId}")
    public ResponseEntity<PaymentResponseDTO> getByBookingId(
            @PathVariable Integer bookingId) {
        return ResponseEntity.ok(paymentService.getByBookingId(bookingId));
    }

    /**
     * Lấy danh sách payment, có thể lọc theo status.
     * Không truyền status → trả về tất cả (dùng cho admin dashboard).
     * VD: GET /api/payments?status=unpaid → danh sách chờ thanh toán.
     */
    @GetMapping
    public ResponseEntity<List<PaymentResponseDTO>> getAll(
            @RequestParam(required = false) PaymentStatus status) {
        return ResponseEntity.ok(paymentService.getByStatus(status));
    }

    // ============================================================
    // VNPAY — sinh QR thanh toán & xử lý callback
    // ============================================================

    /**
     * Sinh ảnh QR thanh toán VNPAY cho 1 payment đã tồn tại (đang ở trạng thái unpaid).
     * Service lấy amount/orderInfo từ chính payment đó để đảm bảo số tiền không bị
     * client tự ý sửa khi gọi API.
     *
     * VD: GET /api/v1/payments/12/vnpay-qr
     */
    @GetMapping("/{id}/vnpay-qr")
    public ResponseEntity<byte[]> getVnpayQrCode(HttpServletRequest request,
                                                 @PathVariable Integer id) throws Exception {
        PaymentResponseDTO payment = paymentService.getById(id);

        // txnRef nên gắn với paymentId thật để dễ đối soát khi VNPAY callback về
        String txnRef = "PAY" + payment.getPaymentId();
        String orderInfo = "Thanh toan don hang #" + payment.getPaymentId();

        // amount lấy từ payment.finalAmount (hoặc field tương ứng trong PaymentResponseDTO),
        // KHÔNG nhận amount trực tiếp từ query param để tránh bị sửa số tiền.
        long amount = payment.getFinalAmount().longValue();

        String paymentUrl = vnPayService.createPaymentUrl(request, amount, orderInfo, txnRef);
        byte[] qrImage = vnPayService.generateQRCode(paymentUrl, 300, 300);

        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_PNG)
                .body(qrImage);
    }

    /**
     * Endpoint VNPAY redirect về sau khi khách thanh toán xong (vnp_ReturnUrl).
     * Phải khớp với giá trị cấu hình trong VNPayConfig.vnp_ReturnUrl.
     */
    @GetMapping("/vnpay-return")
    public ResponseEntity<?> vnpayReturn(HttpServletRequest request) throws Exception {
        Map<String, String> fields = new HashMap<>();
        for (Enumeration<String> params = request.getParameterNames(); params.hasMoreElements(); ) {
            String name = params.nextElement();
            fields.put(name, request.getParameter(name));
        }

        String vnp_SecureHash = fields.remove("vnp_SecureHash");
        fields.remove("vnp_SecureHashType");

        boolean isValid = vnPayService.validateSignature(fields, vnp_SecureHash);
        String responseCode = fields.get("vnp_ResponseCode");
        String txnRef = fields.get("vnp_TxnRef"); // VD: "PAY12" → suy ra paymentId = 12

        if (isValid && "00".equals(responseCode)) {
            // TODO: parse paymentId từ txnRef rồi gọi:
            // paymentService.updateStatus(paymentId, new PaymentUpdateRequestDTO(PaymentStatus.paid));
            return ResponseEntity.ok().body("Thanh toán thành công cho giao dịch: " + txnRef);
        } else {
            // TODO: có thể cập nhật status sang "cancelled" tại đây nếu cần
            return ResponseEntity.badRequest().body("Thanh toán thất bại hoặc chữ ký không hợp lệ");
        }
    }

    /**
     * Endpoint IPN (Instant Payment Notification) — VNPAY SERVER gọi trực tiếp tới đây
     * (server-to-server, không qua trình duyệt khách) để báo kết quả giao dịch.
     * Khác với /vnpay-return (chỉ redirect trình duyệt, không đáng tin cậy 100% vì
     * khách có thể tắt trình duyệt giữa chừng).
     *
     * QUAN TRỌNG:
     *  - Phải luôn trả về JSON dạng {"RspCode": "...", "Message": "..."} theo đúng chuẩn VNPAY,
     *    KHÔNG được trả HTML/redirect, nếu không VNPAY sẽ coi là lỗi và gọi lại nhiều lần.
     *  - Khi chạy local, cần dùng ngrok (hoặc tunnel khác) để VNPAY server gọi được vào URL này,
     *    vì "localhost" không thể truy cập từ bên ngoài.
     *  - URL này (dạng public/ngrok) cần được khai báo cho VNPAY trong cấu hình merchant (vnp_IpnUrl).
     */
    @GetMapping("/vnpay-ipn")
    public ResponseEntity<Map<String, String>> vnpayIpn(HttpServletRequest request) {
        Map<String, String> result = new HashMap<>();
        try {
            Map<String, String> fields = new HashMap<>();
            for (Enumeration<String> params = request.getParameterNames(); params.hasMoreElements(); ) {
                String name = params.nextElement();
                fields.put(name, request.getParameter(name));
            }

            String vnp_SecureHash = fields.remove("vnp_SecureHash");
            fields.remove("vnp_SecureHashType");

            boolean isValid = vnPayService.validateSignature(fields, vnp_SecureHash);

            // Chữ ký không hợp lệ → từ chối, KHÔNG xử lý cập nhật trạng thái
            if (!isValid) {
                result.put("RspCode", "97");
                result.put("Message", "Invalid Signature");
                return ResponseEntity.ok(result);
            }

            String responseCode = fields.get("vnp_ResponseCode");
            String txnRef = fields.get("vnp_TxnRef"); // VD: "PAY12" → paymentId = 12

            Integer paymentId;
            try {
                // txnRef được sinh dạng "PAY" + paymentId trong getVnpayQrCode(...)
                paymentId = Integer.parseInt(txnRef.replace("PAY", ""));
            } catch (Exception e) {
                result.put("RspCode", "01");
                result.put("Message", "Order not found");
                return ResponseEntity.ok(result);
            }

            PaymentResponseDTO payment;
            try {
                payment = paymentService.getById(paymentId);
            } catch (Exception e) {
                result.put("RspCode", "01");
                result.put("Message", "Order not found");
                return ResponseEntity.ok(result);
            }

            // Kiểm tra số tiền khớp với giao dịch gốc, tránh giả mạo callback với số tiền khác
            long vnpAmount = Long.parseLong(fields.get("vnp_Amount")) / 100;
            if (payment.getFinalAmount().longValue() != vnpAmount) {
                result.put("RspCode", "04");
                result.put("Message", "Invalid amount");
                return ResponseEntity.ok(result);
            }

            // Tránh xử lý lại nếu giao dịch đã được cập nhật trước đó (VNPAY có thể gọi IPN nhiều lần)
            if (payment.getPaymentStatus() != PaymentStatus.unpaid) {
                result.put("RspCode", "02");
                result.put("Message", "Order already confirmed");
                return ResponseEntity.ok(result);
            }

            if ("00".equals(responseCode)) {
                paymentService.processPayment(paymentId); // chuyển unpaid -> paid + tích điểm loyalty
            } else {
                paymentService.markFailed(paymentId); // chuyển sang failed
            }

            result.put("RspCode", "00");
            result.put("Message", "Confirm Success");
            return ResponseEntity.ok(result);

        } catch (Exception e) {
            result.put("RspCode", "99");
            result.put("Message", "Unknown error");
            return ResponseEntity.ok(result);
        }
    }
}