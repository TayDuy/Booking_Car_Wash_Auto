package com.autowash.backend.payment.service;

import com.autowash.backend.booking.entity.Booking;
import com.autowash.backend.booking.entity.Booking.BookingStatus;
import com.autowash.backend.booking.repository.BookingRepository;
import com.autowash.backend.booking.repository.BookingDetailRepository;
import com.autowash.backend.payment.dto.*;
import com.autowash.backend.payment.entity.Payment;
import com.autowash.backend.payment.entity.Payment.PaymentStatus;
import com.autowash.backend.payment.repository.PaymentRepository;
import com.autowash.backend.promotion.entity.Promotion;
import com.autowash.backend.promotion.repository.PromotionRepository;
import com.autowash.backend.reward.entity.Reward;
import com.autowash.backend.reward.repository.RewardRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * PaymentService — xử lý toàn bộ nghiệp vụ thanh toán (FR-5).
 *
 * Quan hệ với các service khác:
 *   - BookingService  : payment chỉ tạo được khi booking = completed.
 *   - LoyaltyService  : khi payment → paid, trigger cộng điểm (FR-7) — TODO.
 *   - PromotionService: validate và tính discount từ promotion.
 *   - RewardService   : validate và tính discount từ reward redemption.
 */
@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository       paymentRepository;
    private final BookingRepository       bookingRepository;
    private final BookingDetailRepository bookingDetailRepository;
    private final PromotionRepository     promotionRepository;
    private final RewardRepository        rewardRepository;

    // ── CREATE ────────────────────────────────────────────────────────────────

    /**
     * Tạo payment cho một booking đã completed.
     *
     * Luồng xử lý:
     *   1. Validate booking tồn tại và status = completed.
     *   2. Kiểm tra chưa có payment (tránh duplicate).
     *   3. Tính originalAmount = sum(subTotal) từ booking_detail.
     *   4. Tính discountAmount từ promotion (nếu có).
     *   5. Cộng thêm discount từ reward redemption (nếu có).
     *   6. Cap discountAmount ≤ originalAmount (không hoàn tiền âm).
     *   7. Lưu payment với status = unpaid.
     */
    @Transactional
    public PaymentResponseDTO createPayment(PaymentCreateRequestDTO request) {

        // 1. Validate booking tồn tại và đã completed
        Booking booking = bookingRepository.findById(request.getBookingId())
                .orElseThrow(() -> new RuntimeException("Booking không tồn tại: " + request.getBookingId()));

        if (booking.getStatus() != BookingStatus.completed) {
            throw new RuntimeException("Chỉ tạo payment khi booking đã completed");
        }

        // 2. Tránh tạo duplicate payment cho cùng 1 booking
        if (paymentRepository.existsByBooking_BookingId(request.getBookingId())) {
            throw new RuntimeException("Booking này đã có payment");
        }

        // 3. Tính originalAmount = sum(subTotal) của tất cả booking_detail
        //    Không lấy từ client để tránh giả mạo số tiền
        BigDecimal originalAmount = bookingDetailRepository
                .findByBooking_BookingId(request.getBookingId())
                .stream()
                .map(d -> d.getSubTotal())
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // 4. Tính discount từ promotion nếu client truyền promotionId
        Promotion promotion = null;
        BigDecimal discountAmount = BigDecimal.ZERO;

        if (request.getPromotionId() != null) {
            promotion = promotionRepository.findById(request.getPromotionId())
                    .orElseThrow(() -> new RuntimeException("Promotion không tồn tại"));
            discountAmount = calculateDiscount(promotion, originalAmount);
        }

        // 5. Cộng thêm discount từ reward nếu client truyền rewardId
        Reward reward = null;
        if (request.getRewardId() != null) {
            reward = rewardRepository.findById(request.getRewardId())
                    .orElseThrow(() -> new RuntimeException("Reward không tồn tại"));
            discountAmount = discountAmount.add(reward.getRewardValue());
        }

        // 6. Cap discount — không để finalAmount âm
        if (discountAmount.compareTo(originalAmount) > 0) {
            discountAmount = originalAmount;
        }

        BigDecimal finalAmount = originalAmount.subtract(discountAmount);

        // 7. Lưu payment, status mặc định = unpaid
        Payment payment = Payment.builder()
                .booking(booking)
                .promotion(promotion)
                .reward(reward)
                .originalAmount(originalAmount)
                .discountAmount(discountAmount)
                .finalAmount(finalAmount)
                .paymentMethod(request.getPaymentMethod())
                .paymentStatus(PaymentStatus.unpaid)
                .build();

        return PaymentResponseDTO.fromEntity(paymentRepository.save(payment));
    }

    // ── UPDATE STATUS ─────────────────────────────────────────────────────────

    /**
     * Cập nhật trạng thái payment theo state machine.
     *
     * Khi chuyển sang paid:
     *   - Set paidAt = now().
     *   - TODO: gọi LoyaltyService.earnPoints() để cộng điểm (FR-7).
     */
    @Transactional
    public PaymentResponseDTO updateStatus(Integer paymentId, PaymentUpdateRequestDTO request) {

        Payment payment = findOrThrow(paymentId);

        // Validate chuyển trạng thái hợp lệ theo state machine
        validateStatusTransition(payment.getPaymentStatus(), request.getPaymentStatus());

        payment.setPaymentStatus(request.getPaymentStatus());

        // Ghi nhận thời điểm thanh toán thành công
        if (request.getPaymentStatus() == PaymentStatus.paid) {
            payment.setPaidAt(LocalDateTime.now());
            // TODO: loyaltyService.earnPoints(payment) — FR-7
        }

        return PaymentResponseDTO.fromEntity(paymentRepository.save(payment));
    }

    // ── READ ──────────────────────────────────────────────────────────────────

    /** Lấy chi tiết payment theo paymentId. */
    @Transactional(readOnly = true)
    public PaymentResponseDTO getById(Integer paymentId) {
        return PaymentResponseDTO.fromEntity(findOrThrow(paymentId));
    }

    /**
     * Lấy payment theo bookingId.
     * Dùng khi client chỉ biết bookingId, không biết paymentId.
     */
    @Transactional(readOnly = true)
    public PaymentResponseDTO getByBookingId(Integer bookingId) {
        return PaymentResponseDTO.fromEntity(
                paymentRepository.findByBooking_BookingId(bookingId)
                        .orElseThrow(() -> new RuntimeException(
                                "Payment không tồn tại cho booking: " + bookingId))
        );
    }

    /**
     * Lấy danh sách payment theo status.
     * Null = lấy tất cả (admin dashboard).
     * VD: status=unpaid → nhắc nhở thanh toán; status=paid → thống kê doanh thu.
     */
    @Transactional(readOnly = true)
    public List<PaymentResponseDTO> getByStatus(PaymentStatus status) {
        List<Payment> result = (status == null)
                ? paymentRepository.findAll()
                : paymentRepository.findByPaymentStatus(status);

        return result.stream()
                .map(PaymentResponseDTO::fromEntity)
                .collect(Collectors.toList());
    }

    // ── PRIVATE HELPERS ───────────────────────────────────────────────────────

    private Payment findOrThrow(Integer paymentId) {
        return paymentRepository.findById(paymentId)
                .orElseThrow(() -> new RuntimeException("Payment không tồn tại: " + paymentId));
    }

    /**
     * Tính discount từ promotion theo discountType:
     *   percent      → originalAmount * value / 100
     *   fixed        → value (VND cố định)
     *   free_service → 0 (xử lý riêng ở tầng booking, không giảm tiền trực tiếp)
     */
    private BigDecimal calculateDiscount(Promotion promotion, BigDecimal originalAmount) {
        return switch (promotion.getDiscountType()) {
            case percent -> originalAmount
                    .multiply(promotion.getDiscountValue())
                    .divide(BigDecimal.valueOf(100));
            case fixed   -> promotion.getDiscountValue();
            default      -> BigDecimal.ZERO;
        };
    }

    /**
     * Validate chuyển trạng thái payment theo state machine:
     *   unpaid  → paid / cancelled
     *   failed  → paid  (cho phép retry)
     *   paid    → không cho phép (terminal state)
     *   cancelled → không cho phép (terminal state)
     */
    private void validateStatusTransition(PaymentStatus current, PaymentStatus next) {
        boolean valid = switch (current) {
            case unpaid    -> next == PaymentStatus.paid || next == PaymentStatus.cancelled;
            case failed    -> next == PaymentStatus.paid;
            case paid,
                 cancelled -> false; // terminal states
        };

        if (!valid) {
            throw new RuntimeException(
                    "Không thể chuyển trạng thái từ " + current + " sang " + next);
        }
    }
}