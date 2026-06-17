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
                .discountAmount(payment.getDiscountAmount())
                .finalAmount(payment.getFinalAmount())
                // Phương thức và trạng thái
                .paymentMethod(payment.getPaymentMethod())
                .paymentStatus(payment.getPaymentStatus())
                .paidAt(payment.getPaidAt())
                // Audit
                .createdAt(payment.getCreatedAt())
                .updatedAt(payment.getUpdatedAt())
                .build();
    }
}