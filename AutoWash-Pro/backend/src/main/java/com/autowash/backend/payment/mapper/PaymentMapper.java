package com.autowash.backend.payment.mapper;

import com.autowash.backend.booking.entity.Booking;
import com.autowash.backend.payment.dto.PaymentCreateRequestDTO;
import com.autowash.backend.payment.dto.PaymentResponseDTO;
import com.autowash.backend.payment.entity.Payment;
import com.autowash.backend.promotion.entity.Promotion;
import com.autowash.backend.reward.entity.Reward;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

/**
 * Mapper chuyển đổi Payment entity ↔ DTO.
 * Mọi logic flatten quan hệ lazy tập trung tại đây — DTO không import entity.
 */
@Component
public class PaymentMapper {

    /**
     * Tạo Payment entity từ CreateRequestDTO.
     * originalAmount KHÔNG lấy từ DTO — service truyền vào sau khi tự tính
     * từ BookingDetail để tránh client gửi sai số tiền.
     *
     * finalAmount = originalAmount - discountAmount, tối thiểu 0.
     * discountAmount = 0 nếu không có promotion và reward.
     *
     * @param dto           dữ liệu từ client
     * @param booking       entity Booking đã completed
     * @param promotion     entity Promotion (null = không dùng)
     * @param reward        entity Reward (null = không đổi điểm)
     * @param originalAmount tổng tiền tính từ BookingDetail (service truyền vào)
     * @param discountAmount tổng tiền giảm (service tính sau khi apply promotion + reward)
     * @return Payment entity chưa được persist
     */
    public Payment toEntity(PaymentCreateRequestDTO dto,
                            Booking booking,
                            Promotion promotion,
                            Reward reward,
                            BigDecimal originalAmount,
                            BigDecimal discountAmount) {
        // Đảm bảo discountAmount không null
        BigDecimal discount = discountAmount != null ? discountAmount : BigDecimal.ZERO;

        // finalAmount không được âm
        BigDecimal finalAmount = originalAmount.subtract(discount).max(BigDecimal.ZERO);

        return Payment.builder()
                .booking(booking)
                .promotion(promotion)       // null = không áp dụng khuyến mãi
                .reward(reward)             // null = không đổi điểm thưởng
                .originalAmount(originalAmount)
                .discountAmount(discount)
                .finalAmount(finalAmount)
                .paymentMethod(dto.getPaymentMethod())
                // paymentStatus mặc định = unpaid (do @Builder.Default trong entity)
                .build();
    }

    /**
     * Chuyển Payment entity → ResponseDTO.
     * Flatten Booking, Promotion, Reward — tất cả null-safe.
     * Không expose thông tin nội bộ không cần thiết cho client.
     *
     * @param payment entity đã load đầy đủ quan hệ
     * @return DTO an toàn trả về client
     */
    public PaymentResponseDTO toResponse(Payment payment) {
        BigDecimal voucherDisc = payment.getReward() != null && payment.getReward().getRewardValue() != null
                ? payment.getReward().getRewardValue()
                : BigDecimal.ZERO;
        
        BigDecimal totalDisc = payment.getDiscountAmount() != null
                ? payment.getDiscountAmount()
                : BigDecimal.ZERO;

        java.math.RoundingMode rm = java.math.RoundingMode.HALF_UP;

        // Tính toán online discount (5%) dựa trên originalAmount / 1.08
        BigDecimal onlineDisc = BigDecimal.ZERO;
        boolean isOnline = payment.getPaymentMethod() == Payment.PaymentMethod.bank_transfer
                || payment.getPaymentMethod() == Payment.PaymentMethod.paypal;
        if (isOnline && payment.getOriginalAmount() != null) {
            BigDecimal subtotal = payment.getOriginalAmount().divide(BigDecimal.valueOf(1.08), 0, rm);
            onlineDisc = subtotal.multiply(BigDecimal.valueOf(0.05)).setScale(0, rm);
        }

        // Tính toán tier discount dựa trên hạng thành viên
        BigDecimal tierDisc = calculateTierDiscount(payment, rm);

        BigDecimal promoDisc = totalDisc.subtract(voucherDisc).subtract(onlineDisc).subtract(tierDisc).max(BigDecimal.ZERO);

        return PaymentResponseDTO.builder()
                .paymentId(payment.getPaymentId())
                // Flatten Booking — chỉ lấy id và bookingCode để tra cứu
                .bookingId(payment.getBooking().getBookingId())
                .bookingCode(payment.getBooking().getBookingCode())
                // Flatten Promotion — null nếu không dùng khuyến mãi
                .promotionId(payment.getPromotion() != null
                        ? payment.getPromotion().getPromotionId() : null)
                .promotionName(payment.getPromotion() != null
                        ? payment.getPromotion().getPromotionName() : null)
                // Flatten Reward — null nếu không đổi điểm
                .rewardId(payment.getReward() != null
                        ? payment.getReward().getRewardId() : null)
                .rewardName(payment.getReward() != null
                        ? payment.getReward().getRewardName() : null)
                // Các field tiền
                .originalAmount(payment.getOriginalAmount())
                .discountAmount(totalDisc)
                .promoDiscount(promoDisc)
                .voucherDiscount(voucherDisc)
                .onlineDiscount(onlineDisc)
                .tierDiscount(tierDisc)
                .finalAmount(payment.getFinalAmount())
                // Phương thức và trạng thái
                .paymentMethod(payment.getPaymentMethod())
                .paymentStatus(payment.getPaymentStatus())
                .paidAt(payment.getPaidAt())
                .vnpayTransactionNo(payment.getVnpayTransactionNo())
                .vnpayBankCode(payment.getVnpayBankCode())
                .vnpayCardType(payment.getVnpayCardType())
                .vnpayResponseCode(payment.getVnpayResponseCode())
                .paypalOrderId(payment.getPaypalOrderId())
                .paypalCaptureId(payment.getPaypalCaptureId())
                .paypalPayerEmail(payment.getPaypalPayerEmail())
                // Audit
                .createdAt(payment.getCreatedAt())
                .updatedAt(payment.getUpdatedAt())
                .build();
    }

    private BigDecimal calculateTierDiscount(Payment payment, java.math.RoundingMode rm) {
        try {
            Integer tierId = payment.getBooking().getCustomer().getTierId();
            if (tierId == null) return BigDecimal.ZERO;

            if (payment.getPromotion() != null
                    && payment.getPromotion().getTargetTier() != null
                    && payment.getPromotion().getTargetTier().getTierId().equals(tierId)) {
                return BigDecimal.ZERO;
            }

            BigDecimal tierPercent;
            if (tierId == 2) tierPercent = BigDecimal.valueOf(5);
            else if (tierId == 3) tierPercent = BigDecimal.valueOf(10);
            else if (tierId == 4) tierPercent = BigDecimal.valueOf(15);
            else return BigDecimal.ZERO;

            if (payment.getOriginalAmount() == null) return BigDecimal.ZERO;
            BigDecimal subtotal = payment.getOriginalAmount().divide(BigDecimal.valueOf(1.08), 0, rm);
            return subtotal.multiply(tierPercent).divide(BigDecimal.valueOf(100), 0, rm);
        } catch (Exception e) {
            return BigDecimal.ZERO;
        }
    }
}