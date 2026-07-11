package com.autowash.backend.payment.service.impl;

import com.autowash.backend.booking.entity.Booking;
import com.autowash.backend.booking.entity.BookingDetail;
import com.autowash.backend.booking.enums.BookingStatus;
import com.autowash.backend.booking.repository.BookingDetailRepository;
import com.autowash.backend.booking.repository.BookingRepository;
import com.autowash.backend.booking.service.BookingDetailService;
import com.autowash.backend.customer.entity.Customer;
import com.autowash.backend.customer.repository.CustomerRepository;
import com.autowash.backend.common.exception.BusinessException;
import com.autowash.backend.common.exception.ResourceNotFoundException;
import com.autowash.backend.loyaltytransaction.entity.LoyaltyTransaction;
import com.autowash.backend.loyaltytransaction.repository.LoyaltyTransactionRepository;
import com.autowash.backend.mail.service.MailService;
import com.autowash.backend.payment.dto.PaymentCreateRequestDTO;
import com.autowash.backend.payment.dto.PaymentResponseDTO;
import com.autowash.backend.payment.dto.PaymentUpdateRequestDTO;
import com.autowash.backend.payment.entity.Payment;
import com.autowash.backend.payment.entity.Payment.PaymentStatus;
import com.autowash.backend.payment.mapper.PaymentMapper;
import com.autowash.backend.payment.repository.PaymentRepository;
import com.autowash.backend.payment.service.PayPalService;
import com.autowash.backend.payment.service.PaymentService;
import com.autowash.backend.promotion.entity.Promotion;
import com.autowash.backend.promotion.entity.PromotionUse;
import com.autowash.backend.promotion.repository.PromotionRepository;
import com.autowash.backend.promotion.repository.PromotionUseRepository;
import com.autowash.backend.reward.entity.Reward;
import com.autowash.backend.reward.repository.RewardRepository;
import com.autowash.backend.vehicle.entity.Vehicle;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import com.autowash.backend.customerreward.entity.CustomerReward;
import com.autowash.backend.customerreward.repository.CustomerRewardRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentServiceImpl implements PaymentService {

    private final PaymentRepository            paymentRepository;
    private final BookingRepository            bookingRepository;
    private final BookingDetailService         bookingDetailService;
    private final BookingDetailRepository      bookingDetailRepository;
    private final CustomerRepository           customerRepository;
    private final PromotionRepository          promotionRepository;
    private final PromotionUseRepository       promotionUseRepository;
    private final RewardRepository             rewardRepository;
    private final LoyaltyTransactionRepository loyaltyTransactionRepository;
    private final CustomerRewardRepository     customerRewardRepository;
    private final PaymentMapper paymentMapper;
    private final PayPalService                payPalService;
    private final MailService                  mailService;

    // Tỉ lệ tích điểm: cứ 10,000 VND = 1 điểm
    private static final BigDecimal POINTS_PER_VND = BigDecimal.valueOf(10_000);

    // ── CREATE ───────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public PaymentResponseDTO createPayment(PaymentCreateRequestDTO request) {
        Integer bookingId = request.getBookingId();
        Booking booking = findBookingOrThrow(bookingId);

        if (BookingStatus.cancelled.equals(booking.getStatus())
                || BookingStatus.no_show.equals(booking.getStatus())) {
            throw new BusinessException(
                    "Không thể tạo payment cho booking đã ở trạng thái: " + booking.getStatus());
        }

        var existingPaymentOpt = paymentRepository.findByBooking_BookingId(bookingId);
        if (existingPaymentOpt.isPresent()) {
            Payment existing = existingPaymentOpt.get();
            if (existing.getPaymentStatus() == PaymentStatus.unpaid) {
                return paymentMapper.toResponse(existing);
            }
            if (existing.getPaymentStatus() == PaymentStatus.paid) {
                throw new BusinessException("Booking này đã được thanh toán", HttpStatus.CONFLICT);
            }
        }

        BigDecimal serviceTotal = bookingDetailService.calculateTotalAmount(bookingId);

        BigDecimal surcharge = BigDecimal.ZERO;
        Vehicle vehicle = booking.getVehicle();
        if (vehicle != null && (vehicle.getVehicleType() == Vehicle.VehicleType.suv
                || vehicle.getVehicleType() == Vehicle.VehicleType.truck)) {
            surcharge = BigDecimal.valueOf(50000);
        }

        BigDecimal subtotal = serviceTotal.add(surcharge);
        BigDecimal tax = subtotal.multiply(BigDecimal.valueOf(0.08))
                .setScale(0, RoundingMode.HALF_UP);
        BigDecimal originalAmount = subtotal.add(tax);

        boolean isOnline = request.getPaymentMethod() == Payment.PaymentMethod.bank_transfer
                || request.getPaymentMethod() == Payment.PaymentMethod.paypal;
        BigDecimal discountAmount = BigDecimal.ZERO;
        if (isOnline) {
            discountAmount = subtotal.multiply(BigDecimal.valueOf(0.05))
                    .setScale(0, RoundingMode.HALF_UP);
        }

        Promotion promotion = null;
        Reward reward = null;
        BigDecimal promoDiscount = BigDecimal.ZERO;
        BigDecimal voucherDiscount = BigDecimal.ZERO;
        CustomerReward appliedVoucher = null;

        // 1. Tính toán giảm giá từ Promotion
        if (request.getPromotionId() != null) {
            Promotion tempPromo = promotionRepository.findById(request.getPromotionId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Promotion", "id", request.getPromotionId()));
            Customer customer = booking.getCustomer();
            promoDiscount = validateAndApplyPromotion(tempPromo, booking, subtotal, customer);
            promotion = tempPromo;
        }

        // 2. Tính toán giảm giá từ Voucher (Ưu tiên voucherCode, fallback sang rewardId)
        String vCode = request.getVoucherCode();
        if ((vCode == null || vCode.trim().isEmpty()) && request.getRewardId() != null) {
            // Fallback: Tìm voucher Unused tương ứng với rewardId của khách hàng
            List<CustomerReward> myUnused = customerRewardRepository
                    .findByCustomer_CustomerIdAndStatusOrderByRedeemedAtDesc(booking.getCustomer().getCustomerId(), "UNUSED");
            appliedVoucher = myUnused.stream()
                    .filter(vr -> vr.getReward().getRewardId().equals(request.getRewardId()))
                    .findFirst()
                    .orElse(null);
        } else if (vCode != null && !vCode.trim().isEmpty()) {
            appliedVoucher = customerRewardRepository.findByVoucherCode(vCode.trim())
                    .orElseThrow(() -> new ResourceNotFoundException("CustomerReward", "voucherCode", vCode));
        }

        if (appliedVoucher != null) {
            // Kiểm tra tính hợp lệ của voucher
            if (!"UNUSED".equals(appliedVoucher.getStatus())) {
                throw new BusinessException("Voucher đã được sử dụng hoặc không còn hiệu lực");
            }
            if (appliedVoucher.getExpiredAt() != null && appliedVoucher.getExpiredAt().isBefore(LocalDateTime.now())) {
                appliedVoucher.setStatus("EXPIRED");
                customerRewardRepository.save(appliedVoucher);
                throw new BusinessException("Voucher đã hết hạn sử dụng");
            }
            if (!appliedVoucher.getCustomer().getCustomerId().equals(booking.getCustomer().getCustomerId())) {
                throw new BusinessException("Voucher này không thuộc về tài khoản của bạn", HttpStatus.FORBIDDEN);
            }
            voucherDiscount = appliedVoucher.getDiscountValue() != null ? appliedVoucher.getDiscountValue() : BigDecimal.ZERO;
        }

        // 3. Áp dụng chính sách "chọn 1 cái cao nhất" (Only apply the highest discount)
        if (promotion != null && promoDiscount.compareTo(voucherDiscount) > 0) {
            // Áp dụng Promotion, bỏ Voucher
            discountAmount = discountAmount.add(promoDiscount);
            reward = null; // không dùng reward
        } else if (appliedVoucher != null && voucherDiscount.compareTo(BigDecimal.ZERO) > 0) {
            // Áp dụng Voucher, bỏ Promotion
            discountAmount = discountAmount.add(voucherDiscount);
            promotion = null; // không dùng promotion

            // Cập nhật trạng thái Voucher thành USED
            appliedVoucher.setStatus("USED");
            appliedVoucher.setUsedBookingId(booking.getBookingId());
            appliedVoucher.setUsedAt(LocalDateTime.now());
            customerRewardRepository.save(appliedVoucher);

            // Gắn reward template vào payment để phục vụ hiển thị/báo cáo
            reward = appliedVoucher.getReward();
        } else if (request.getRewardId() != null && appliedVoucher == null) {
            // Fallback cực hạn cho legacy logic: tự động trừ điểm trực tiếp (nếu không đổi voucher trước)
            Reward legacyReward = rewardRepository.findById(request.getRewardId())
                    .orElseThrow(() -> new ResourceNotFoundException("Reward", "id", request.getRewardId()));
            validateAndDeductRewardPoints(booking.getCustomer(), legacyReward);
            discountAmount = discountAmount.add(legacyReward.getRewardValue());
            reward = legacyReward;
            promotion = null;
        } else {
            // Không áp dụng cái nào
            promotion = null;
            reward = null;
        }

        BigDecimal finalAmount = originalAmount.subtract(discountAmount)
                .max(BigDecimal.ZERO)
                .setScale(2, RoundingMode.HALF_UP);

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
        log.info("Payment created: id={}, bookingId={}, serviceTotal={}, surcharge={}, tax={}, discount={}, finalAmount={}",
                saved.getPaymentId(), bookingId, serviceTotal, surcharge, tax, discountAmount, finalAmount);

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
    public PaymentResponseDTO processPayment(Integer paymentId, String transactionNo, String bankCode, String cardType, String responseCode) {
        Payment payment = findPaymentOrThrowForUpdate(paymentId);

        if (!PaymentStatus.unpaid.equals(payment.getPaymentStatus())) {
            throw new BusinessException(
                    "Payment phải ở trạng thái unpaid, hiện tại: " + payment.getPaymentStatus());
        }

        payment.setPaymentStatus(PaymentStatus.paid);
        payment.setPaidAt(LocalDateTime.now());
        payment.setVnpayTransactionNo(transactionNo);
        payment.setVnpayBankCode(bankCode);
        payment.setVnpayCardType(cardType);
        payment.setVnpayResponseCode(responseCode);

        Payment saved = finalizePaid(payment);

        log.info("Payment {} processed, loyalty points earned for customer {}",
                paymentId, saved.getBooking().getCustomer().getCustomerId());

        return paymentMapper.toResponse(saved);
    }

    // ── PAYPAL ────────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public Map<String, String> createPaypalOrder(Integer paymentId) {
        Payment payment = findPaymentOrThrow(paymentId);

        if (!PaymentStatus.unpaid.equals(payment.getPaymentStatus())) {
            throw new BusinessException(
                    "Chỉ có thể tạo đơn PayPal cho payment ở trạng thái unpaid, hiện tại: "
                            + payment.getPaymentStatus());
        }

        // Cập nhật phương thức thanh toán sang PayPal phòng trường hợp payment được tạo ban đầu bằng VNPAY
        payment.setPaymentMethod(Payment.PaymentMethod.paypal);

        String description = "Thanh toan don hang #" + payment.getPaymentId()
                + " - " + payment.getBooking().getBookingCode();

        Map<String, String> order = payPalService.createOrder(
                payment.getFinalAmount(), payment.getPaymentId(), description);

        payment.setPaypalOrderId(order.get("orderId"));
        paymentRepository.save(payment);

        log.info("PayPal order created: paymentId={}, orderId={}", paymentId, order.get("orderId"));
        return order;
    }

    @Override
    @Transactional
    public PaymentResponseDTO processPaypalPayment(String paypalOrderId) {
        Payment payment = paymentRepository.findByPaypalOrderIdForUpdate(paypalOrderId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment", "paypalOrderId", paypalOrderId));

        // Idempotent: nếu đã paid rồi (ví dụ PayPal redirect về 2 lần) thì trả luôn kết quả hiện tại.
        if (PaymentStatus.paid.equals(payment.getPaymentStatus())) {
            return paymentMapper.toResponse(payment);
        }

        if (!PaymentStatus.unpaid.equals(payment.getPaymentStatus())) {
            throw new BusinessException(
                    "Payment phải ở trạng thái unpaid, hiện tại: " + payment.getPaymentStatus());
        }

        Map<String, String> captureResult = payPalService.captureOrder(paypalOrderId);
        String status = captureResult.get("status");

        if (!"COMPLETED".equalsIgnoreCase(status)) {
            payment.setPaymentStatus(PaymentStatus.failed);
            Payment saved = paymentRepository.save(payment);
            log.warn("PayPal capture không COMPLETED (status={}) cho orderId={}", status, paypalOrderId);
            return paymentMapper.toResponse(saved);
        }

        payment.setPaymentStatus(PaymentStatus.paid);
        payment.setPaidAt(LocalDateTime.now());
        payment.setPaypalCaptureId(captureResult.get("captureId"));
        payment.setPaypalPayerEmail(captureResult.get("payerEmail"));

        Payment saved = finalizePaid(payment);

        log.info("Payment {} processed via PayPal, loyalty points earned for customer {}",
                saved.getPaymentId(), saved.getBooking().getCustomer().getCustomerId());

        return paymentMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public PaymentResponseDTO markPaypalFailed(String paypalOrderId) {
        Payment payment = paymentRepository.findByPaypalOrderIdForUpdate(paypalOrderId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment", "paypalOrderId", paypalOrderId));

        if (!PaymentStatus.unpaid.equals(payment.getPaymentStatus())) {
            // Đã paid hoặc đã failed từ trước — không cần xử lý lại.
            return paymentMapper.toResponse(payment);
        }

        payment.setPaymentStatus(PaymentStatus.failed);
        Payment saved = paymentRepository.save(payment);
        log.info("Payment {} marked failed (PayPal cancelled), orderId={}", saved.getPaymentId(), paypalOrderId);
        return paymentMapper.toResponse(saved);
    }

    /**
     * Logic chung khi một payment chuyển sang "paid" (dùng cho cả VNPAY và PayPal):
     * lưu payment, tích điểm loyalty (FR-7), cộng total_spending cho customer.
     */
    private Payment finalizePaid(Payment payment) {
        Payment saved = paymentRepository.save(payment);

        // FR-7: Tích điểm loyalty
        earnLoyaltyPoints(saved);

        // Cập nhật total_spending của customer
        Customer customer = saved.getBooking().getCustomer();
        customer.setTotalSpending(customer.getTotalSpending().add(saved.getFinalAmount()));
        customerRepository.save(customer);

        // Gửi email xác nhận sau khi thanh toán thành công
        sendBookingConfirmationEmail(saved);

        return saved;
    }

    private void sendBookingConfirmationEmail(Payment payment) {
        try {
            var booking = payment.getBooking();
            var customer = booking.getCustomer();
            var slot = booking.getSlot();
            var branch = booking.getBranch();

            String toEmail = customer.getUser() != null ? customer.getUser().getEmail() : null;
            if (toEmail == null) return;

            List<BookingDetail> details = bookingDetailRepository.findByBooking(booking);
            if (details.isEmpty()) return;

            String serviceNames = details.stream()
                    .map(d -> d.getService().getServiceName())
                    .collect(Collectors.joining(", "));
            BigDecimal totalPrice = details.stream()
                    .map(BookingDetail::getSubTotal)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            mailService.sendBookingConfirmationEmail(
                    toEmail,
                    customer.getFullName(),
                    booking.getBookingCode(),
                    branch.getBranchName(),
                    branch.getAddress(),
                    serviceNames,
                    slot.getSlotDate(),
                    slot.getStartTime(),
                    slot.getEndTime(),
                    totalPrice
            );
        } catch (Exception e) {
            log.error("Lỗi khi gửi email xác nhận sau thanh toán: {}", e.getMessage(), e);
        }
    }

    @Override
    @Transactional
    public PaymentResponseDTO cancelPayment(Integer paymentId) {
        Payment payment = findPaymentOrThrowForUpdate(paymentId);

        if (!PaymentStatus.unpaid.equals(payment.getPaymentStatus())) {
            throw new BusinessException("Chỉ có thể hủy payment ở trạng thái unpaid");
        }

        // Hoàn trả voucher hoặc điểm thưởng
        boolean voucherReleased = releaseAppliedVoucher(payment.getBooking().getBookingId());
        if (!voucherReleased && payment.getReward() != null) {
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
    public PaymentResponseDTO markFailed(Integer paymentId, String transactionNo, String bankCode, String cardType, String responseCode) {
        Payment payment = findPaymentOrThrowForUpdate(paymentId);

        if (!PaymentStatus.unpaid.equals(payment.getPaymentStatus())) {
            throw new BusinessException("Chỉ chuyển failed từ trạng thái unpaid");
        }

        // Hoàn trả voucher hoặc điểm thưởng khi thanh toán thất bại
        boolean voucherReleased = releaseAppliedVoucher(payment.getBooking().getBookingId());
        if (!voucherReleased && payment.getReward() != null) {
            refundRewardPoints(payment);
        }

        payment.setPaymentStatus(PaymentStatus.failed);
        payment.setVnpayTransactionNo(transactionNo);
        payment.setVnpayBankCode(bankCode);
        payment.setVnpayCardType(cardType);
        payment.setVnpayResponseCode(responseCode);

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

    // ── PRIVATE — validate + tính discount promotion ────────────────────────

    private BigDecimal validateAndApplyPromotion(Promotion promotion, Booking booking, BigDecimal subtotal, Customer customer) {
        if (!Promotion.PromotionStatus.active.equals(promotion.getStatus())) {
            throw new BusinessException("Promotion không còn hiệu lực");
        }

        LocalDate today = LocalDate.now();
        if (today.isBefore(promotion.getStartDate()) || today.isAfter(promotion.getEndDate())) {
            throw new BusinessException("Promotion ngoài thời hạn sử dụng");
        }

        if (promotion.getMinOrderValue() != null && subtotal.compareTo(promotion.getMinOrderValue()) < 0) {
            throw new BusinessException(
                    "Giá trị đơn hàng chưa đạt tối thiểu " + promotion.getMinOrderValue() + " VND");
        }

        if (promotion.getTargetTier() != null) {
            Integer customerTierId = customer.getTierId();
            if (customerTierId == null || !customerTierId.equals(promotion.getTargetTier().getTierId())) {
                throw new BusinessException(
                        "Khuyến mãi chỉ áp dụng cho hạng " + promotion.getTargetTier().getTierName());
            }
        }

        if (promotion.getVehicleType() != null) {
            Vehicle vehicle = booking.getVehicle();
            if (vehicle == null
                    || !promotion.getVehicleType().name().equalsIgnoreCase(vehicle.getVehicleType().name())) {
                throw new BusinessException("Khuyến mãi không áp dụng cho loại xe này");
            }
        }

        if (promotion.getUsageLimit() != null) {
            long usedCount = promotionUseRepository.countByPromotionId(promotion.getPromotionId());
            if (usedCount >= promotion.getUsageLimit()) {
                throw new BusinessException("Khuyến mãi đã hết lượt sử dụng");
            }
        }

        if (promotionUseRepository.existsByPromotionIdAndCustomerId(
                promotion.getPromotionId(), customer.getCustomerId())) {
            throw new BusinessException("Bạn đã sử dụng khuyến mãi này rồi");
        }

        BigDecimal discountAmount = switch (promotion.getDiscountType()) {
            case percent -> subtotal
                    .multiply(promotion.getDiscountValue())
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            case fixed        -> promotion.getDiscountValue().min(subtotal);
            case free_service -> promotion.getDiscountValue();
        };

        promotionUseRepository.save(PromotionUse.builder()
                .promotionId(promotion.getPromotionId())
                .customerId(customer.getCustomerId())
                .orderValue(subtotal)
                .discountAmount(discountAmount)
                .finalAmount(subtotal.subtract(discountAmount).max(BigDecimal.ZERO))
                .status(PromotionUse.PromotionUseStatus.used)
                .usedAt(LocalDateTime.now())
                .build());

        return discountAmount;
    }

    // ── PRIVATE — tích điểm loyalty (FR-7) ──────────────────────────────────

    private void earnLoyaltyPoints(Payment payment) {
        int pointsEarned = payment.getFinalAmount()
                .divide(POINTS_PER_VND, 0, RoundingMode.FLOOR)
                .intValue();

        if (pointsEarned <= 0) return;

        Customer customer = payment.getBooking().getCustomer();

        Integer currentBalance = loyaltyTransactionRepository
                .findTopByCustomerIdOrderByCreatedAtDesc(customer.getCustomerId())
                .map(LoyaltyTransaction::getBalanceAfter)
                .orElse(0);

        customer.setTotalPoints(customer.getTotalPoints() + pointsEarned);
        customerRepository.save(customer);

        loyaltyTransactionRepository.save(LoyaltyTransaction.builder()
                .customerId(Integer.valueOf(customer.getCustomerId()))
                .paymentId(Long.valueOf(payment.getPaymentId()))
                .transactionType("earn")
                .points(pointsEarned)
                .balanceBefore(currentBalance)
                .balanceAfter(currentBalance + pointsEarned)
                .note("Tích điểm từ thanh toán #" + payment.getPaymentId())
                .build());

        log.info("Loyalty earned: customerId={}, points={}, lifetimePoints={}, currentBalance={}",
                customer.getCustomerId(), pointsEarned, customer.getTotalPoints(), currentBalance + pointsEarned);
    }

    // ── PRIVATE — redeem / hoàn điểm reward ─────────────────────────────────

    private void validateAndDeductRewardPoints(Customer customer, Reward reward) {
        if (!Reward.RewardStatus.active.equals(reward.getStatus())) {
            throw new BusinessException("Reward không còn hiệu lực");
        }

        Integer currentBalance = loyaltyTransactionRepository
                .findTopByCustomerIdOrderByCreatedAtDesc(customer.getCustomerId())
                .map(LoyaltyTransaction::getBalanceAfter)
                .orElse(0);

        if (currentBalance < reward.getRequiredPoints()) {
            throw new BusinessException(
                    "Không đủ điểm để đổi reward (cần " + reward.getRequiredPoints()
                            + ", hiện có " + currentBalance + ")");
        }

        int balanceAfter = currentBalance - reward.getRequiredPoints();

        loyaltyTransactionRepository.save(LoyaltyTransaction.builder()
                .customerId(Integer.valueOf(customer.getCustomerId()))
                .transactionType("redeem")
                .points(-reward.getRequiredPoints())
                .balanceBefore(currentBalance)
                .balanceAfter(balanceAfter)
                .note("Đổi reward: " + reward.getRewardName())
                .build());
    }

    private void refundRewardPoints(Payment payment) {
        Reward reward     = payment.getReward();
        Customer customer = payment.getBooking().getCustomer();

        Integer currentBalance = loyaltyTransactionRepository
                .findTopByCustomerIdOrderByCreatedAtDesc(customer.getCustomerId())
                .map(LoyaltyTransaction::getBalanceAfter)
                .orElse(0);

        int balanceAfter = currentBalance + reward.getRequiredPoints();

        loyaltyTransactionRepository.save(LoyaltyTransaction.builder()
                .customerId(Integer.valueOf(customer.getCustomerId()))
                .transactionType("adjust")
                .points(reward.getRequiredPoints())
                .balanceBefore(currentBalance)
                .balanceAfter(balanceAfter)
                .note("Hoàn điểm do hủy payment #" + payment.getPaymentId())
                .build());

        log.info("Reward points refunded: customerId={}, points={}",
                customer.getCustomerId(), reward.getRequiredPoints());
    }

    private boolean releaseAppliedVoucher(Integer bookingId) {
        if (bookingId == null) return false;
        java.util.Optional<CustomerReward> voucherOpt = customerRewardRepository.findByUsedBookingId(bookingId);
        if (voucherOpt.isPresent()) {
            CustomerReward voucher = voucherOpt.get();
            voucher.setStatus("UNUSED");
            voucher.setUsedBookingId(null);
            voucher.setUsedAt(null);
            customerRewardRepository.save(voucher);
            log.info("Released voucher {} back to UNUSED for booking {}", voucher.getVoucherCode(), bookingId);
            return true;
        }
        return false;
    }

    // ── PRIVATE HELPERS ──────────────────────────────────────────────────────

    private Payment findPaymentOrThrow(Integer paymentId) {
        return paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Payment", "id", paymentId));
    }

    private Payment findPaymentOrThrowForUpdate(Integer paymentId) {
        return paymentRepository.findByIdForUpdate(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Payment", "id", paymentId));
    }

    private Booking findBookingOrThrow(Integer bookingId) {
        return bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Booking", "id", bookingId));
    }
}