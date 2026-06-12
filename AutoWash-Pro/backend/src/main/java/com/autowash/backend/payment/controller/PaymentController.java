package com.autowash.backend.payment.controller;

import com.autowash.backend.payment.dto.*;
import com.autowash.backend.payment.entity.Payment.PaymentStatus;
import com.autowash.backend.payment.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * PaymentController — REST API cho nghiệp vụ thanh toán (FR-5).
 *
 * Base path: /api/payments
 *
 * Endpoints:
 *   POST   /                        → tạo payment sau khi booking completed
 *   PATCH  /{id}/status             → cập nhật trạng thái (unpaid→paid/cancelled)
 *   GET    /{id}                    → xem chi tiết payment
 *   GET    /booking/{bookingId}     → xem payment theo bookingId
 *   GET    /?status={status}        → lọc danh sách theo status (admin)
 */
@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

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
}