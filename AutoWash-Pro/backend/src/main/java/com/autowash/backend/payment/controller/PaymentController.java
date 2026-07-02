package com.autowash.backend.payment.controller;

import com.autowash.backend.payment.dto.*;
import com.autowash.backend.payment.entity.Payment.PaymentStatus;
import com.autowash.backend.payment.service.PaymentService;
import com.autowash.backend.booking.repository.BookingRepository;
import com.autowash.backend.payment.repository.PaymentRepository;
import com.autowash.backend.customer.repository.CustomerRepository;
import com.autowash.backend.security.CustomUserDetails;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import com.autowash.backend.payment.service.VNPayService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.MediaType;
import java.util.HashMap;
import java.util.Map;
import java.util.Enumeration;

/**
 * PaymentController — REST API cho nghiệp vụ thanh toán (FR-5).
 */
@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;
    private final BookingRepository bookingRepository;
    private final PaymentRepository paymentRepository;
    private final CustomerRepository customerRepository;
    private final VNPayService vnPayService;

    /**
     * Tạo payment cho booking đã completed.
     * Khách hàng sở hữu booking hoặc Staff/Admin mới được phép tạo.
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('CUSTOMER', 'STAFF', 'ADMIN')")
    public ResponseEntity<PaymentResponseDTO> create(
            @Valid @RequestBody PaymentCreateRequestDTO request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        verifyBookingOwnership(request.getBookingId(), userDetails);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(paymentService.createPayment(request));
    }

    /**
     * Cập nhật trạng thái payment.
     * Khách hàng chỉ được phép hủy/đánh dấu thất bại đối với payment của chính mình.
     * Chỉ Staff/Admin mới được xác nhận trạng thái "paid" (Đã thanh toán).
     */
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'STAFF', 'ADMIN')")
    public ResponseEntity<PaymentResponseDTO> updateStatus(
            @PathVariable Integer id,
            @Valid @RequestBody PaymentUpdateRequestDTO request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        verifyPaymentOwnership(id, userDetails);
        
        if (PaymentStatus.paid.equals(request.getPaymentStatus())) {
            boolean isStaffOrAdmin = userDetails.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_STAFF"));
            if (!isStaffOrAdmin) {
                throw new com.autowash.backend.common.exception.BusinessException(
                        "Khách hàng không thể tự xác nhận đã thanh toán (paid)", HttpStatus.FORBIDDEN);
            }
        }
        
        return ResponseEntity.ok(paymentService.updateStatus(id, request));
    }

    /**
     * Lấy chi tiết payment theo paymentId.
     * Staff/Admin có quyền xem tất cả. Khách hàng chỉ được xem payment của chính mình.
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'STAFF', 'ADMIN')")
    public ResponseEntity<PaymentResponseDTO> getById(
            @PathVariable Integer id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        verifyPaymentOwnership(id, userDetails);
        return ResponseEntity.ok(paymentService.getById(id));
    }

    /**
     * Lấy payment theo bookingId.
     * Staff/Admin có quyền xem tất cả. Khách hàng chỉ được xem payment của chính mình.
     */
    @GetMapping("/booking/{bookingId}")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'STAFF', 'ADMIN')")
    public ResponseEntity<PaymentResponseDTO> getByBookingId(
            @PathVariable Integer bookingId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        verifyBookingOwnership(bookingId, userDetails);
        return ResponseEntity.ok(paymentService.getByBookingId(bookingId));
    }

    /**
     * Lấy danh sách payment, có thể lọc theo status.
     * Chỉ cho phép STAFF hoặc ADMIN xem toàn bộ danh sách.
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<List<PaymentResponseDTO>> getAll(
            @RequestParam(required = false) PaymentStatus status) {
        return ResponseEntity.ok(paymentService.getByStatus(status));
    }

    // ============================================================
    // VNPAY — sinh QR thanh toán & xử lý callback
    // ============================================================

    /**
     * Sinh ảnh QR thanh toán VNPAY cho 1 payment đã tồn tại (đang ở trạng thái unpaid).
     * Chỉ khách hàng sở hữu đơn thanh toán hoặc Staff/Admin mới được quyền sinh mã.
     */
    @GetMapping("/{id}/vnpay-qr")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'STAFF', 'ADMIN')")
    public ResponseEntity<byte[]> getVnpayQrCode(
            HttpServletRequest request,
            @PathVariable Integer id,
            @AuthenticationPrincipal CustomUserDetails userDetails) throws Exception {
        verifyPaymentOwnership(id, userDetails);
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

    /**
     * Endpoint VNPAY redirect về sau khi khách thanh toán xong (vnp_ReturnUrl).
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
        String txnRef = fields.get("vnp_TxnRef");

        if (isValid && "00".equals(responseCode)) {
            return ResponseEntity.ok().body("Thanh toán thành công cho giao dịch: " + txnRef);
        } else {
            return ResponseEntity.badRequest().body("Thanh toán thất bại hoặc chữ ký không hợp lệ");
        }
    }

    /**
     * Endpoint IPN (Instant Payment Notification) — VNPAY SERVER gọi trực tiếp tới đây
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

            String vnp_TransactionNo = fields.get("vnp_TransactionNo");
            String vnp_BankCode = fields.get("vnp_BankCode");
            String vnp_CardType = fields.get("vnp_CardType");
            String vnp_ResponseCode = fields.get("vnp_ResponseCode");

            if ("00".equals(responseCode)) {
                paymentService.processPayment(paymentId, vnp_TransactionNo, vnp_BankCode, vnp_CardType, vnp_ResponseCode);
            } else {
                paymentService.markFailed(paymentId, vnp_TransactionNo, vnp_BankCode, vnp_CardType, vnp_ResponseCode);
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

    // ── PRIVATE HELPERS FOR OWNERSHIP CHECKS ──────────────────────────────────

    private void verifyBookingOwnership(Integer bookingId, CustomUserDetails userDetails) {
        boolean isStaffOrAdmin = userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_STAFF"));
        if (isStaffOrAdmin) {
            return;
        }
        com.autowash.backend.booking.entity.Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new com.autowash.backend.common.exception.ResourceNotFoundException("Booking", "id", bookingId));
        com.autowash.backend.customer.entity.Customer customer = customerRepository.findByUser_Id(userDetails.getId())
                .orElseThrow(() -> new com.autowash.backend.common.exception.BusinessException("Không tìm thấy khách hàng", HttpStatus.FORBIDDEN));
        if (!booking.getCustomer().getCustomerId().equals(customer.getCustomerId())) {
            throw new com.autowash.backend.common.exception.BusinessException(
                    "Bạn không có quyền truy cập thông tin thanh toán của lịch đặt này", HttpStatus.FORBIDDEN);
        }
    }

    private void verifyPaymentOwnership(Integer paymentId, CustomUserDetails userDetails) {
        boolean isStaffOrAdmin = userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_STAFF"));
        if (isStaffOrAdmin) {
            return;
        }
        com.autowash.backend.payment.entity.Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new com.autowash.backend.common.exception.ResourceNotFoundException("Payment", "id", paymentId));
        com.autowash.backend.customer.entity.Customer customer = customerRepository.findByUser_Id(userDetails.getId())
                .orElseThrow(() -> new com.autowash.backend.common.exception.BusinessException("Không tìm thấy khách hàng", HttpStatus.FORBIDDEN));
        if (!payment.getBooking().getCustomer().getCustomerId().equals(customer.getCustomerId())) {
            throw new com.autowash.backend.common.exception.BusinessException(
                    "Bạn không có quyền truy cập thông tin thanh toán này", HttpStatus.FORBIDDEN);
        }
    }
}