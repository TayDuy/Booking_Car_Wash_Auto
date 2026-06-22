package com.autowash.backend.payment.service.impl;

import com.autowash.backend.booking.entity.Booking;
import com.autowash.backend.booking.enums.BookingStatus;
import com.autowash.backend.booking.repository.BookingRepository;
import com.autowash.backend.booking.service.BookingDetailService;
import com.autowash.backend.customer.entity.Customer;
import com.autowash.backend.customer.repository.CustomerRepository;
import com.autowash.backend.common.exception.BusinessException;
import com.autowash.backend.common.exception.ResourceNotFoundException;
import com.autowash.backend.loyaltytransaction.entity.LoyaltyTransaction;
import com.autowash.backend.loyaltytransaction.repository.LoyaltyTransactionRepository;
import com.autowash.backend.payment.dto.PaymentCreateRequestDTO;
import com.autowash.backend.payment.dto.PaymentResponseDTO;
import com.autowash.backend.payment.dto.PaymentUpdateRequestDTO;
import com.autowash.backend.payment.entity.Payment;
import com.autowash.backend.payment.entity.Payment.PaymentStatus;
import com.autowash.backend.payment.mapper.PaymentMapper;
import com.autowash.backend.payment.repository.PaymentRepository;
import com.autowash.backend.payment.service.PaymentService;
import com.autowash.backend.promotion.entity.Promotion;
import com.autowash.backend.promotion.repository.PromotionRepository;
import com.autowash.backend.reward.entity.Reward;
import com.autowash.backend.reward.repository.RewardRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentServiceImpl implements PaymentService {

    private final PaymentRepository            paymentRepository;
    private final BookingRepository            bookingRepository;
    private final BookingDetailService         bookingDetailService;
    private final CustomerRepository           customerRepository;
    private final PromotionRepository          promotionRepository;
    private final RewardRepository             rewardRepository;
    private final LoyaltyTransactionRepository loyaltyTransactionRepository;
    private final PaymentMapper                paymentMapper;

    // Tỉ lệ tích điểm: cứ 10,000 VND = 1 điểm
    private static final BigDecimal POINTS_PER_VND = BigDecimal.valueOf(10_000);

    // ── CREATE ───────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public PaymentResponseDTO createPayment(PaymentCreateRequestDTO request) {
        Integer bookingId = request.getBookingId();
        Booking booking = findBookingOrThrow(bookingId);

        // Chỉ tạo payment khi booking đã completed
        if (!BookingStatus.completed.equals(booking.getStatus())) {
            throw new BusinessException(
                    "Chỉ tạo payment khi booking đã completed, hiện tại: " + booking.getStatus());
        }

        // Kiểm tra chưa có payment
        if (paymentRepository.existsByBooking_BookingId(bookingId)) {
            throw new BusinessException("Booking này đã có payment rồi");
        }

        // 1. Tính original amount từ BookingDetail — không nhận từ client
        BigDecimal originalAmount = bookingDetailService.calculateTotalAmount(bookingId);

        // 2. Áp dụng promotion (nếu có)
        Promotion promotion = null;
        BigDecimal discountAmount = BigDecimal.ZERO;

        if (request.getPromotionId() != null) {
            promotion = promotionRepository.findById(request.getPromotionId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Promotion", "id", request.getPromotionId()));
            discountAmount = calculatePromotionDiscount(promotion, originalAmount);
        }

        // 3. Áp dụng reward (nếu có) — cộng thêm vào discount
        Reward reward = null;
        if (request.getRewardId() != null) {
            reward = rewardRepository.findById(request.getRewardId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Reward", "id", request.getRewardId()));
            validateAndDeductRewardPoints(booking.getCustomer(), reward);
            discountAmount = discountAmount.add(reward.getRewardValue());
        }

        // 4. finalAmount không được âm
        BigDecimal finalAmount = originalAmount.subtract(discountAmount)
                .max(BigDecimal.ZERO)
                .setScale(2, RoundingMode.HALF_UP);

        // 5. Build và persist payment
        Payment payment = Payment.builder()
                .booking(booking)
                .promotion(promotion)
                .reward(reward)
                .originalAmount(originalAmount)
                .discountAmount(discountAmount.setScale(2, RoundingMode.HALF_UP))
                .finalAmount(finalAmount)
                .paymentMethod(request.getPaymentMethod())
                .paymentStatus(PaymentStatus.unpaid)
                .build();

        Payment saved = paymentRepository.save(payment);
        log.info("Payment created: id={}, bookingId={}, finalAmount={}",
                saved.getPaymentId(), bookingId, finalAmount);

        return paymentMapper.toResponse(saved);
    }

    // ── UPDATE STATUS ────────────────────────────────────────────────────────

    @Override
    @Transactional
    public PaymentResponseDTO updateStatus(Integer paymentId, PaymentUpdateRequestDTO request) {
        return switch (request.getPaymentStatus()) {
            case paid      -> processPayment(paymentId);
            case cancelled -> cancelPayment(paymentId);
            case failed    -> markFailed(paymentId);
            default -> throw new BusinessException(
                    "Trạng thái không hợp lệ: " + request.getPaymentStatus());
        };
    }

    // ── PROCESS — unpaid → paid ──────────────────────────────────────────────

    @Override
    @Transactional
    public PaymentResponseDTO processPayment(Integer paymentId) {
        Payment payment = findPaymentOrThrow(paymentId);

        if (!PaymentStatus.unpaid.equals(payment.getPaymentStatus())) {
            throw new BusinessException(
                    "Payment phải ở trạng thái unpaid, hiện tại: " + payment.getPaymentStatus());
        }

        payment.setPaymentStatus(PaymentStatus.paid);
        payment.setPaidAt(LocalDateTime.now());
        Payment saved = paymentRepository.save(payment);

        // FR-7: Tích điểm loyalty
        earnLoyaltyPoints(saved);

        // Cập nhật total_spending của customer
        Customer customer = saved.getBooking().getCustomer();
        customer.setTotalSpending(customer.getTotalSpending().add(saved.getFinalAmount()));
        customerRepository.save(customer);

        log.info("Payment {} processed, loyalty points earned for customer {}",
                paymentId, customer.getCustomerId());

        return paymentMapper.toResponse(saved);
    }

    // ── CANCEL — unpaid → cancelled ──────────────────────────────────────────

    @Override
    @Transactional
    public PaymentResponseDTO cancelPayment(Integer paymentId) {
        Payment payment = findPaymentOrThrow(paymentId);

        if (!PaymentStatus.unpaid.equals(payment.getPaymentStatus())) {
            throw new BusinessException("Chỉ có thể hủy payment ở trạng thái unpaid");
        }

        // Hoàn trả điểm reward nếu đã trừ khi tạo payment
        if (payment.getReward() != null) {
            refundRewardPoints(payment);
        }

        payment.setPaymentStatus(PaymentStatus.cancelled);
        Payment saved = paymentRepository.save(payment);

        log.info("Payment {} cancelled", paymentId);
        return paymentMapper.toResponse(saved);
    }

    // ── MARK FAILED — unpaid → failed ────────────────────────────────────────

    @Override
    @Transactional
    public PaymentResponseDTO markFailed(Integer paymentId) {
        Payment payment = findPaymentOrThrow(paymentId);

        if (!PaymentStatus.unpaid.equals(payment.getPaymentStatus())) {
            throw new BusinessException("Chỉ chuyển failed từ trạng thái unpaid");
        }

        payment.setPaymentStatus(PaymentStatus.failed);
        return paymentMapper.toResponse(paymentRepository.save(payment));
    }

    // ── READ ─────────────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public List<PaymentResponseDTO> getByStatus(PaymentStatus status) {
        List<Payment> payments = status == null
                ? paymentRepository.findAll()
                : paymentRepository.findByPaymentStatus(status);
        return payments.stream()
                .map(paymentMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public PaymentResponseDTO getById(Integer paymentId) {
        return paymentMapper.toResponse(findPaymentOrThrow(paymentId));
    }

    @Override
    @Transactional(readOnly = true)
    public PaymentResponseDTO getByBookingId(Integer bookingId) {
        return paymentRepository.findByBooking_BookingId(bookingId)
                .map(paymentMapper::toResponse)   // ✅ đúng cú pháp method reference
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Payment", "bookingId", bookingId));
    }

    // ── PRIVATE — tính discount promotion ───────────────────────────────────

    private BigDecimal calculatePromotionDiscount(Promotion promotion, BigDecimal originalAmount) {
        if (!Promotion.PromotionStatus.active.equals(promotion.getStatus())) {
            throw new BusinessException("Promotion không còn hiệu lực");
        }

        LocalDateTime now = LocalDateTime.now();
        if (now.toLocalDate().isBefore(promotion.getStartDate())
                || now.toLocalDate().isAfter(promotion.getEndDate())) {
            throw new BusinessException("Promotion ngoài thời hạn sử dụng");
        }

        if (promotion.getMinOrderValue() != null
                && originalAmount.compareTo(promotion.getMinOrderValue()) < 0) {
            throw new BusinessException(
                    "Giá trị đơn hàng chưa đạt tối thiểu "
                            + promotion.getMinOrderValue() + " VND");
        }

        return switch (promotion.getDiscountType()) {
            case percent -> originalAmount
                    .multiply(promotion.getDiscountValue())
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            case fixed        -> promotion.getDiscountValue().min(originalAmount);
            case free_service -> promotion.getDiscountValue();
        };
    }

    // ── PRIVATE — tích điểm loyalty (FR-7) ──────────────────────────────────

    private void earnLoyaltyPoints(Payment payment) {
        int pointsEarned = payment.getFinalAmount()
                .divide(POINTS_PER_VND, 0, RoundingMode.FLOOR)
                .intValue();

        if (pointsEarned <= 0) return;

        Customer customer = payment.getBooking().getCustomer();
        int balanceBefore = customer.getTotalPoints();
        int balanceAfter  = balanceBefore + pointsEarned;

        customer.setTotalPoints(balanceAfter);
        customerRepository.save(customer);

        loyaltyTransactionRepository.save(LoyaltyTransaction.builder()
                .customerId(Integer.valueOf(customer.getCustomerId()))
                .paymentId(Long.valueOf(payment.getPaymentId()))
                .transactionType("earn")
                .points(pointsEarned)
                .balanceBefore(balanceBefore)
                .balanceAfter(balanceAfter)
                .note("Tích điểm từ thanh toán #" + payment.getPaymentId())
                .build());

        log.info("Loyalty earned: customerId={}, points={}, balanceAfter={}",
                customer.getCustomerId(), pointsEarned, balanceAfter);
    }

    // ── PRIVATE — redeem / hoàn điểm reward ─────────────────────────────────

    private void validateAndDeductRewardPoints(Customer customer, Reward reward) {
        if (!Reward.RewardStatus.active.equals(reward.getStatus())) {
            throw new BusinessException("Reward không còn hiệu lực");
        }

        if (customer.getTotalPoints() < reward.getRequiredPoints()) {
            throw new BusinessException(
                    "Không đủ điểm để đổi reward (cần " + reward.getRequiredPoints()
                            + ", hiện có " + customer.getTotalPoints() + ")");
        }

        int balanceBefore = customer.getTotalPoints();
        int balanceAfter  = balanceBefore - reward.getRequiredPoints();

        customer.setTotalPoints(balanceAfter);
        customerRepository.save(customer);

        loyaltyTransactionRepository.save(LoyaltyTransaction.builder()
                .customerId(Integer.valueOf(customer.getCustomerId()))
                .transactionType("redeem")
                .points(-reward.getRequiredPoints())
                .balanceBefore(balanceBefore)
                .balanceAfter(balanceAfter)
                .note("Đổi reward: " + reward.getRewardName())
                .build());
    }

    private void refundRewardPoints(Payment payment) {
        Reward reward     = payment.getReward();
        Customer customer = payment.getBooking().getCustomer();

        int balanceBefore = customer.getTotalPoints();
        int balanceAfter  = balanceBefore + reward.getRequiredPoints();

        customer.setTotalPoints(balanceAfter);
        customerRepository.save(customer);

        loyaltyTransactionRepository.save(LoyaltyTransaction.builder()
                .customerId(Integer.valueOf(customer.getCustomerId()))
                .transactionType("adjust")
                .points(reward.getRequiredPoints())
                .balanceBefore(balanceBefore)
                .balanceAfter(balanceAfter)
                .note("Hoàn điểm do hủy payment #" + payment.getPaymentId())
                .build());

        log.info("Reward points refunded: customerId={}, points={}",
                customer.getCustomerId(), reward.getRequiredPoints());
    }

    // ── PRIVATE HELPERS ──────────────────────────────────────────────────────

    private Payment findPaymentOrThrow(Integer paymentId) {
        return paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Payment", "id", paymentId));
    }

    private Booking findBookingOrThrow(Integer bookingId) {
        return bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Booking", "id", bookingId));
    }
}