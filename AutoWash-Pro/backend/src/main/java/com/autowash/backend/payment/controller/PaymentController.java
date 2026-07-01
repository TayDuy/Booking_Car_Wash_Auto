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