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
import com.autowash.backend.loyaltytier.entity.LoyaltyTier;
import com.autowash.backend.loyaltytier.repository.LoyaltyTierRepository;
import com.autowash.backend.loyaltytransaction.entity.LoyaltyTransaction;
import com.autowash.backend.loyaltytransaction.repository.LoyaltyTransactionRepository;
import com.autowash.backend.mail.service.MailService;
import com.autowash.backend.notification.dto.NotificationCreateDTO;
import com.autowash.backend.notification.entity.Notification;
import com.autowash.backend.notification.service.NotificationService;
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
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
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
    private final LoyaltyTierRepository        loyaltyTierRepository;
    private final CustomerRewardRepository     customerRewardRepository;
    private final PaymentMapper paymentMapper;
    private final PayPalService                payPalService;
    private final MailService                  mailService;
    private final NotificationService          notificationService;

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
            if (existing.getPaymentStatus() == PaymentStatus.paid) {
                throw new BusinessException("Booking này đã được thanh toán", HttpStatus.CONFLICT);
            }

            // Giải phóng voucher cũ nếu có áp dụng trước đó và flush lập tức
            customerRewardRepository.findByUsedBookingId(bookingId).ifPresent(oldVoucher -> {
                oldVoucher.setStatus("UNUSED");
                oldVoucher.setUsedBookingId(null);
                oldVoucher.setUsedAt(null);
                customerRewardRepository.saveAndFlush(oldVoucher);
            });

            // Giải phóng promotion cũ nếu có áp dụng trước đó và flush lập tức
            if (existing.getPromotion() != null) {
                try {
                    promotionUseRepository.deleteByPromotionIdAndCustomerId(
                            existing.getPromotion().getPromotionId(),
                            booking.getCustomer().getCustomerId()
                    );
                    promotionUseRepository.flush();
                } catch (Exception e) {
                    log.error("Lỗi khi giải phóng Promotion cũ: ", e);
                }
            }

            // Xóa liên kết cũ trên thực thể và flush để đồng bộ trạng thái sạch trước khi tính toán mới
            existing.setPromotion(null);
            existing.setReward(null);
            paymentRepository.saveAndFlush(existing);
        }

        BigDecimal serviceTotal = bookingDetailService.calculateTotalAmount(bookingId);

        BigDecimal surcharge = BigDecimal.ZERO;
        Vehicle vehicle = booking.getVehicle();
        if (vehicle != null && vehicle.getVehicleType() == Vehicle.VehicleType.SEVEN_SEATS) {
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

        // 1. Tính toán giảm giá từ Promotion (Nếu có truyền id thì dùng, không thì tự động chọn cái cao nhất)
        Customer customer = booking.getCustomer();
        if (request.getPromotionId() != null) {
            Promotion tempPromo = promotionRepository.findById(request.getPromotionId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Promotion", "id", request.getPromotionId()));

            if (promotionUseRepository.existsByPromotionIdAndCustomerId(
                    tempPromo.getPromotionId(), customer.getCustomerId())) {
                log.warn("Promotion {} đã được customer {} sử dụng trước đó. Bỏ qua, chạy auto-scan.",
                        request.getPromotionId(), customer.getCustomerId());
            } else {
                promoDiscount = validateAndApplyPromotion(tempPromo, booking, subtotal, customer);
                promotion = tempPromo;
            }
        }

        if (promotion == null) {
            // Tự động quét tìm Promotion active áp dụng tốt nhất cho khách hàng
            List<Promotion> activePromotions = promotionRepository.findAll().stream()
                    .filter(p -> Promotion.PromotionStatus.active.equals(p.getStatus()))
                    .filter(p -> p.isValid())
                    .toList();

            // Batch-fetch promotion use data để tránh N+1
            List<Integer> promoIds = activePromotions.stream()
                    .map(Promotion::getPromotionId).toList();
            Set<Integer> usedIds = new HashSet<>(
                    promotionUseRepository.findUsedPromotionIds(promoIds, customer.getCustomerId()));
            Map<Integer, Long> usageCounts = promotionUseRepository.countByPromotionIds(promoIds)
                    .stream().collect(Collectors.toMap(
                            arr -> (Integer) arr[0], arr -> (Long) arr[1]));

            Promotion bestPromo = null;
            BigDecimal maxPromoDiscount = BigDecimal.ZERO;

            for (Promotion p : activePromotions) {
                if (usedIds.contains(p.getPromotionId())) continue;

                if (p.getUsageLimit() != null) {
                    long usedCount = usageCounts.getOrDefault(p.getPromotionId(), 0L);
                    if (usedCount >= p.getUsageLimit()) continue;
                }

                // Chỉ truyền đúng Promotion.VehicleType vào isApplicable() khi loại xe của
                // booking thực sự khớp với vehicleType mà promotion này yêu cầu (xem
                // vehicleTypeMatches()). Nếu promotion không giới hạn loại xe (vehicleType == null)
                // thì pVehicleType để null cũng không ảnh hưởng gì.
                Promotion.VehicleType pVehicleType = null;
                Vehicle bookingVehicle = booking.getVehicle();
                if (bookingVehicle != null && bookingVehicle.getVehicleType() != null
                        && p.getVehicleType() != null
                        && vehicleTypeMatches(p.getVehicleType(), bookingVehicle.getVehicleType())) {
                    pVehicleType = p.getVehicleType();
                }

                if (p.isApplicable(customer.getTierId(), pVehicleType, subtotal)) {
                    BigDecimal calculated = calculateDiscount(p, subtotal);
                    if (calculated.compareTo(maxPromoDiscount) > 0) {
                        maxPromoDiscount = calculated;
                        bestPromo = p;
                    }
                }
            }

            if (bestPromo != null) {
                // Áp dụng promotion tự động chọn
                promoDiscount = validateAndApplyPromotion(bestPromo, booking, subtotal, customer);
                promotion = bestPromo;
            }
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
            java.util.Optional<CustomerReward> byCode = customerRewardRepository.findByVoucherCode(vCode.trim());
            if (byCode.isEmpty()) {
                log.warn("VoucherCode {} không tồn tại trong DB, bỏ qua.", vCode);
            } else {
                appliedVoucher = byCode.get();
            }
        }

        if (appliedVoucher != null) {
            // Kiểm tra tính hợp lệ của voucher
            if (!"UNUSED".equals(appliedVoucher.getStatus())) {
                log.warn("Voucher {} đã được sử dụng (status={}), bỏ qua.", appliedVoucher.getVoucherCode(), appliedVoucher.getStatus());
                appliedVoucher = null;
            } else if (appliedVoucher.getExpiredAt() != null && appliedVoucher.getExpiredAt().isBefore(LocalDateTime.now())) {
                log.warn("Voucher {} đã hết hạn, bỏ qua.", appliedVoucher.getVoucherCode());
                appliedVoucher.setStatus("EXPIRED");
                customerRewardRepository.save(appliedVoucher);
                appliedVoucher = null;
            } else if (!appliedVoucher.getCustomer().getCustomerId().equals(booking.getCustomer().getCustomerId())) {
                log.warn("Voucher {} không thuộc customer {}, bỏ qua.", appliedVoucher.getVoucherCode(), booking.getCustomer().getCustomerId());
                appliedVoucher = null;
            } else {
                voucherDiscount = appliedVoucher.getDiscountValue() != null ? appliedVoucher.getDiscountValue() : BigDecimal.ZERO;
            }
        }

        // 3. Áp dụng cộng dồn cả Promotion và Voucher
        if (promotion != null) {
            discountAmount = discountAmount.add(promoDiscount);
        }
        if (appliedVoucher != null && voucherDiscount.compareTo(BigDecimal.ZERO) > 0) {
            discountAmount = discountAmount.add(voucherDiscount);

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
        }

        // 4. Tier-based discount từ hạng thành viên (Silver 5%, Gold 10%, Platinum 15%)
        //    Chỉ áp dụng nếu promotion hiện tại không target đúng hạng này (tránh double discount)
        BigDecimal tierDiscount = BigDecimal.ZERO;
        boolean promotionCoversTier = promotion != null
                && promotion.getTargetTier() != null
                && promotion.getTargetTier().getTierId().equals(customer.getTierId());
        if (!promotionCoversTier && customer.getTierId() != null) {
            BigDecimal tierPercent;
            if (customer.getTierId() == 2) {
                tierPercent = BigDecimal.valueOf(5);
            } else if (customer.getTierId() == 3) {
                tierPercent = BigDecimal.valueOf(10);
            } else if (customer.getTierId() == 4) {
                tierPercent = BigDecimal.valueOf(15);
            } else {
                tierPercent = BigDecimal.ZERO;
            }
            if (tierPercent.compareTo(BigDecimal.ZERO) > 0) {
                tierDiscount = subtotal.multiply(tierPercent)
                        .divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP);
                discountAmount = discountAmount.add(tierDiscount);
                log.info("Tier discount applied: tierId={}, rate={}%, amount={}",
                        customer.getTierId(), tierPercent, tierDiscount);
            }
        } else if (promotionCoversTier) {
            log.info("Tier discount skipped — promotion {} already targets tierId={}",
                    promotion.getPromotionName(), customer.getTierId());
        }

        // Chặn discount vượt quá 80% giá trị đơn hàng — tránh stack additive abuse
        BigDecimal maxDiscount = originalAmount.multiply(BigDecimal.valueOf(0.8))
                .setScale(0, RoundingMode.HALF_UP);
        BigDecimal cappedDiscount = discountAmount.min(maxDiscount);

        BigDecimal finalAmount = originalAmount.subtract(cappedDiscount)
                .max(BigDecimal.ZERO)
                .setScale(2, RoundingMode.HALF_UP);

        Payment payment;
        if (existingPaymentOpt.isPresent()) {
            payment = existingPaymentOpt.get();
            payment.setPromotion(promotion);
            payment.setReward(reward);
            payment.setOriginalAmount(originalAmount);
            payment.setDiscountAmount(discountAmount.setScale(2, RoundingMode.HALF_UP));
            payment.setFinalAmount(finalAmount);
            payment.setPaymentMethod(request.getPaymentMethod());
            payment.setPaymentStatus(PaymentStatus.unpaid);
        } else {
            payment = Payment.builder()
                    .booking(booking)
                    .promotion(promotion)
                    .reward(reward)
                    .originalAmount(originalAmount)
                    .discountAmount(discountAmount.setScale(2, RoundingMode.HALF_UP))
                    .finalAmount(finalAmount)
                    .paymentMethod(request.getPaymentMethod())
                    .paymentStatus(PaymentStatus.unpaid)
                    .build();
        }

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

        // Cập nhật total_spending và total_visits của customer
        Customer customer = saved.getBooking().getCustomer();
        customer.setTotalSpending(customer.getTotalSpending().add(saved.getFinalAmount()));
        int currentVisits = customer.getTotalVisits() != null ? customer.getTotalVisits() : 0;
        customer.setTotalVisits(currentVisits + 1);

        // Đánh giá lại hạng thành viên dựa trên tổng điểm/chi tiêu/số lần
        updateCustomerTier(customer);

        customerRepository.save(customer);

        // Gửi email xác nhận sau khi thanh toán thành công
        sendBookingConfirmationEmail(saved);

        // Thông báo in-app khi thanh toán thành công
        notifyPaymentSuccess(saved);

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

    /** Gửi email + tạo thông báo in-app khi thanh toán thành công. */
    private void notifyPaymentSuccess(Payment payment) {
        Booking booking = payment.getBooking();
        Customer customer = booking.getCustomer();
        String bookingCode = booking.getBookingCode();

        try {
            if (customer.getUser() != null) {
                notificationService.create(NotificationCreateDTO.builder()
                        .userId(customer.getUser().getId())
                        .type(Notification.NotificationType.PAYMENT_COMPLETED)
                        .title("Thanh toán thành công")
                        .body(String.format(
                                "Thanh toán %s VND cho lịch #%s đã hoàn tất.",
                                payment.getFinalAmount().toPlainString(),
                                bookingCode
                        ))
                        .referenceId(booking.getBookingId())
                        .referenceType("booking")
                        .channel(Notification.NotificationChannel.in_app)
                        .build());
            }
        } catch (Exception e) {
            log.error("Lỗi khi tạo thông báo in-app cho payment {}: {}",
                    payment.getPaymentId(), e.getMessage(), e);
        }

        try {
            String toEmail = customer.getUser() != null ? customer.getUser().getEmail() : null;
            if (toEmail != null) {
                mailService.sendPaymentSuccessEmail(
                        toEmail,
                        customer.getFullName(),
                        bookingCode,
                        payment.getPaymentMethod() != null ? payment.getPaymentMethod().name() : "N/A",
                        payment.getFinalAmount()
                );
            }
        } catch (Exception e) {
            log.error("Lỗi khi kích hoạt gửi email xác nhận thanh toán cho payment {}: {}",
                    payment.getPaymentId(), e.getMessage(), e);
        }
    }

    /** Gửi email + tạo thông báo in-app khi thanh toán thất bại/bị hủy. */
    private void notifyPaymentFailed(Payment payment, String reason) {
        Booking booking = payment.getBooking();
        Customer customer = booking.getCustomer();
        String bookingCode = booking.getBookingCode();

        try {
            if (customer.getUser() != null) {
                notificationService.create(NotificationCreateDTO.builder()
                        .userId(customer.getUser().getId())
                        .type(Notification.NotificationType.PAYMENT_FAILED)
                        .title("Thanh toán không thành công")
                        .body(String.format(
                                "Thanh toán cho lịch #%s không thành công. %s",
                                bookingCode, reason == null ? "" : reason
                        ))
                        .referenceId(booking.getBookingId())
                        .referenceType("booking")
                        .channel(Notification.NotificationChannel.in_app)
                        .build());
            }
        } catch (Exception e) {
            log.error("Lỗi khi tạo thông báo in-app cho payment thất bại {}: {}",
                    payment.getPaymentId(), e.getMessage(), e);
        }

        try {
            String toEmail = customer.getUser() != null ? customer.getUser().getEmail() : null;
            if (toEmail != null) {
                mailService.sendPaymentFailedEmail(
                        toEmail,
                        customer.getFullName(),
                        bookingCode,
                        reason
                );
            }
        } catch (Exception e) {
            log.error("Lỗi khi kích hoạt gửi email thanh toán thất bại cho payment {}: {}",
                    payment.getPaymentId(), e.getMessage(), e);
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

        notifyPaymentFailed(saved, "Đã hủy");

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

        Payment saved = paymentRepository.save(payment);

        notifyPaymentFailed(saved, responseCode);

        return paymentMapper.toResponse(saved);
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
            if (vehicle == null || vehicle.getVehicleType() == null
                    || !vehicleTypeMatches(promotion.getVehicleType(), vehicle.getVehicleType())) {
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
            log.warn("validateAndApplyPromotion: customer {} đã dùng promotion {} rồi, bỏ qua.",
                    customer.getCustomerId(), promotion.getPromotionId());
            return BigDecimal.ZERO;
        }

        BigDecimal discountAmount = calculateDiscount(promotion, subtotal);

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

    /**
     * So khớp Vehicle.VehicleType (chỉ còn FOUR_SEATS / SEVEN_SEATS) với
     * Promotion.VehicleType (sedan / suv / truck / minivan — enum cũ, chi tiết hơn).
     * Vì Vehicle giờ chỉ phân biệt 4 chỗ – 7 chỗ nên gộp nhóm:
     *   sedan                    ↔ FOUR_SEATS
     *   suv, truck, minivan      ↔ SEVEN_SEATS
     */
    private boolean vehicleTypeMatches(Promotion.VehicleType promoType, Vehicle.VehicleType vehicleType) {
        if (promoType == null || vehicleType == null) return false;
        return switch (promoType) {
            case sedan -> vehicleType == Vehicle.VehicleType.FOUR_SEATS;
            case suv, truck, minivan -> vehicleType == Vehicle.VehicleType.SEVEN_SEATS;
        };
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
                .customerId(customer.getCustomerId())
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

    // ── PRIVATE — đánh giá lại hạng thành viên ─────────────────────────────

    /**
     * Kiểm tra customer có đủ điều kiện lên hạng cao hơn dựa trên tổng điểm,
     * tổng chi tiêu và số lần ghé thăm sau mỗi lần thanh toán thành công.
     * Duyệt từ hạng cao nhất (priorityLevel desc) → gán hạng đầu tiên thỏa mãn.
     */
    private void updateCustomerTier(Customer customer) {
        List<LoyaltyTier> tiers = loyaltyTierRepository.findByIsActiveTrueOrderByPriorityLevelDesc();
        Integer visits = customer.getTotalVisits() != null ? customer.getTotalVisits() : 0;
        BigDecimal spending = customer.getTotalSpending() != null ? customer.getTotalSpending() : BigDecimal.ZERO;

        for (LoyaltyTier tier : tiers) {
            int reqVisits = tier.getMinVisits() != null ? tier.getMinVisits() : 0;
            BigDecimal reqSpending = tier.getMinSpending() != null ? tier.getMinSpending() : BigDecimal.ZERO;

            // Default tier (Member) always matches
            if (reqVisits <= 0 && reqSpending.compareTo(BigDecimal.ZERO) <= 0) {
                if (!tier.getTierId().equals(customer.getTierId())) {
                    customer.setTierId(tier.getTierId());
                }
                return;
            }

            // Match logic: visits >= minVisits OR spending >= minSpending (align với LoyaltyTierEvaluationServiceImpl)
            boolean meetsVisits = visits >= reqVisits;
            boolean meetsSpending = spending.compareTo(reqSpending) >= 0;

            if (meetsVisits || meetsSpending) {
                if (!tier.getTierId().equals(customer.getTierId())) {
                    customer.setTierId(tier.getTierId());
                    log.info("Customer {} upgraded to tier {} (id={}) — visits={}, spending={}",
                            customer.getCustomerId(), tier.getTierName(), tier.getTierId(),
                            visits, spending);
                }
                return;
            }
        }
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
        return bookingRepository.findByIdWithAssociations(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Booking", "id", bookingId));
    }

    private BigDecimal calculateDiscount(Promotion promotion, BigDecimal subtotal) {
        return switch (promotion.getDiscountType()) {
            case percent -> subtotal
                    .multiply(promotion.getDiscountValue())
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            case fixed        -> promotion.getDiscountValue().min(subtotal);
            case free_service -> subtotal;
        };
    }
}