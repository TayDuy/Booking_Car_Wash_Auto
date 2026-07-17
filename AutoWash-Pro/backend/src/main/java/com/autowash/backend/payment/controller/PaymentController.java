package com.autowash.backend.payment.controller;

import com.autowash.backend.payment.dto.*;
import com.autowash.backend.payment.entity.Payment.PaymentStatus;
import com.autowash.backend.payment.service.PaymentService;
import com.autowash.backend.payment.service.VNPayService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.util.UriComponentsBuilder;
import org.springframework.beans.factory.annotation.Value;

import java.net.URI;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;
    private final VNPayService vnPayService;

    @Value("${app.frontend-base-url:http://localhost:5173}")
    private String frontendBaseUrl;

    @PreAuthorize("hasRole('CUSTOMER')")
    @PostMapping
    public ResponseEntity<PaymentResponseDTO> create(
            @Valid @RequestBody PaymentCreateRequestDTO request) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(paymentService.createPayment(request));
    }

    @PreAuthorize("hasRole('CUSTOMER')")
    @PatchMapping("/{id}/status")
    public ResponseEntity<PaymentResponseDTO> updateStatus(
            @PathVariable Integer id,
            @Valid @RequestBody PaymentUpdateRequestDTO request) {
        return ResponseEntity.ok(paymentService.updateStatus(id, request));
    }

    @PreAuthorize("isAuthenticated()")
    @GetMapping("/{id}")
    public ResponseEntity<PaymentResponseDTO> getById(@PathVariable Integer id) {
        return ResponseEntity.ok(paymentService.getById(id));
    }

    @PreAuthorize("hasAnyRole('EMPLOYEE','ADMIN')")
    @GetMapping("/booking/{bookingId}")
    public ResponseEntity<PaymentResponseDTO> getByBookingId(
            @PathVariable Integer bookingId) {
        return ResponseEntity.ok(paymentService.getByBookingId(bookingId));
    }

    @PreAuthorize("hasAnyRole('EMPLOYEE','ADMIN')")
    @GetMapping
    public ResponseEntity<List<PaymentResponseDTO>> getAll(
            @RequestParam(required = false) PaymentStatus status) {
        return ResponseEntity.ok(paymentService.getByStatus(status));
    }

    @PreAuthorize("hasRole('CUSTOMER')")
    @GetMapping("/{id}/vnpay-qr")
    public ResponseEntity<byte[]> getVnpayQrCode(HttpServletRequest request,
                                                  @PathVariable Integer id) throws Exception {
        PaymentResponseDTO payment = paymentService.getById(id);

        String txnRef = "PAY" + payment.getPaymentId();
        String orderInfo = "Thanh toan don hang #" + payment.getPaymentId();
        long amount = payment.getFinalAmount().longValue();

        String paymentUrl = vnPayService.createPaymentUrl(request, amount, orderInfo, txnRef);
        byte[] qrImage = vnPayService.generateQRCode(paymentUrl, 300, 300);

        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_PNG)
                .body(qrImage);
    }

    @GetMapping("/vnpay-return")
    public ResponseEntity<Void> vnpayReturn(HttpServletRequest request) {
        Map<String, String> fields = new HashMap<>();
        for (Enumeration<String> params = request.getParameterNames(); params.hasMoreElements(); ) {
            String name = params.nextElement();
            fields.put(name, request.getParameter(name));
        }

        String vnp_SecureHash = fields.remove("vnp_SecureHash");
        fields.remove("vnp_SecureHashType");

        boolean isValid;
        try {
            isValid = vnPayService.validateSignature(fields, vnp_SecureHash);
        } catch (java.io.UnsupportedEncodingException e) {
            return redirectTo(failureUrl(null, "invalid_signature"));
        }
        String responseCode = fields.get("vnp_ResponseCode");
        String txnRef = fields.get("vnp_TxnRef");

        if (!isValid) {
            return redirectTo(failureUrl(null, "invalid_signature"));
        }

        Integer paymentId;
        try {
            paymentId = Integer.parseInt(txnRef.replace("PAY", ""));
        } catch (Exception e) {
            return redirectTo(failureUrl(null, "invalid_order"));
        }

        PaymentResponseDTO payment;
        try {
            payment = paymentService.getById(paymentId);
        } catch (Exception e) {
            return redirectTo(failureUrl(null, "order_not_found"));
        }

        Long vnpAmount = null;
        try {
            vnpAmount = Long.parseLong(fields.get("vnp_Amount")) / 100;
        } catch (Exception ignored) {
        }
        boolean amountMatches = vnpAmount != null && payment.getFinalAmount().longValue() == vnpAmount;

        if (payment.getPaymentStatus() == PaymentStatus.unpaid && amountMatches) {
            if ("00".equals(responseCode)) {
                payment = paymentService.processPayment(
                        paymentId,
                        fields.get("vnp_TransactionNo"),
                        fields.get("vnp_BankCode"),
                        fields.get("vnp_CardType"),
                        responseCode
                );
            } else {
                payment = paymentService.markFailed(
                        paymentId,
                        fields.get("vnp_TransactionNo"),
                        fields.get("vnp_BankCode"),
                        fields.get("vnp_CardType"),
                        responseCode
                );
            }
        }

        if (payment.getPaymentStatus() == PaymentStatus.paid) {
            return redirectTo(successUrl(paymentId));
        }
        return redirectTo(failureUrl(payment.getBookingId(), "payment_failed"));
    }

    // ── PAYPAL ────────────────────────────────────────────────────────────────

    /**
     * Tạo PayPal Order cho payment {id} — gọi khi khách chọn phương thức PayPal.
     * Trả về orderId + approvalUrl để frontend redirect (window.location.href = approvalUrl).
     */
    @PreAuthorize("hasRole('CUSTOMER')")
    @PostMapping("/{id}/paypal-order")
    public ResponseEntity<Map<String, String>> createPaypalOrder(@PathVariable Integer id) {
        return ResponseEntity.ok(paymentService.createPaypalOrder(id));
    }

    /**
     * PayPal redirect trình duyệt (KHÔNG kèm JWT) về đây sau khi khách approve thanh toán,
     * kèm query "token" = PayPal order id (và "PayerID"). Capture ngay tại đây rồi
     * redirect tiếp về trang thanh toán frontend — cùng pattern với vnpay-return.
     */
    @GetMapping("/paypal-return")
    public ResponseEntity<Void> paypalReturn(@RequestParam("token") String orderId) {
        PaymentResponseDTO payment;
        try {
            payment = paymentService.processPaypalPayment(orderId);
        } catch (Exception e) {
            return redirectTo(failureUrl(null, "paypal_capture_failed"));
        }

        if (payment.getPaymentStatus() == PaymentStatus.paid) {
            return redirectTo(successUrl(payment.getPaymentId()));
        }
        return redirectTo(failureUrl(payment.getBookingId(), "paypal_not_completed"));
    }

    /**
     * Khách bấm "Cancel"/quay lại từ trang PayPal — đánh dấu payment failed và
     * redirect về trang thanh toán để khách có thể thử lại.
     */
    @GetMapping("/paypal-cancel")
    public ResponseEntity<Void> paypalCancel(@RequestParam(value = "token", required = false) String orderId) {
        Integer bookingId = null;
        if (orderId != null) {
            try {
                bookingId = paymentService.markPaypalFailed(orderId).getBookingId();
            } catch (Exception ignored) {
                // orderId không hợp lệ/không tìm thấy — vẫn redirect về trang thanh toán bình thường.
            }
        }
        return redirectTo(failureUrl(bookingId, "paypal_cancelled"));
    }

    private String successUrl(Integer paymentId) {
        return UriComponentsBuilder.fromUriString(frontendBaseUrl + "/customer/payment/success")
                .queryParam("paymentId", paymentId)
                .toUriString();
    }

    private String failureUrl(Integer bookingId, String reason) {
        UriComponentsBuilder builder = UriComponentsBuilder
                .fromUriString(frontendBaseUrl + "/customer/payment")
                .queryParam("paymentFailed", "1")
                .queryParam("reason", reason);
        if (bookingId != null) {
            builder.queryParam("bookingId", bookingId);
        }
        return builder.toUriString();
    }

    private ResponseEntity<Void> redirectTo(String url) {
        HttpHeaders headers = new HttpHeaders();
        headers.setLocation(URI.create(url));
        return new ResponseEntity<>(headers, HttpStatus.FOUND);
    }

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

            if (!isValid) {
                result.put("RspCode", "97");
                result.put("Message", "Invalid Signature");
                return ResponseEntity.ok(result);
            }

            String responseCode = fields.get("vnp_ResponseCode");
            String txnRef = fields.get("vnp_TxnRef");

            Integer paymentId;
            try {
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

            long vnpAmount = Long.parseLong(fields.get("vnp_Amount")) / 100;
            if (payment.getFinalAmount().longValue() != vnpAmount) {
                result.put("RspCode", "04");
                result.put("Message", "Invalid amount");
                return ResponseEntity.ok(result);
            }

            if (payment.getPaymentStatus() != PaymentStatus.unpaid) {
                result.put("RspCode", "02");
                result.put("Message", "Order already confirmed");
                return ResponseEntity.ok(result);
            }

            if ("00".equals(responseCode)) {
                paymentService.processPayment(paymentId);
            } else {
                paymentService.markFailed(paymentId);
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