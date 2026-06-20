package com.autowash.backend.payment.service;

import com.autowash.backend.common.exception.BusinessException;
import com.autowash.backend.common.exception.ResourceNotFoundException;
import com.autowash.backend.customer.entity.Customer;
import com.autowash.backend.customer.repository.CustomerRepository;
import com.autowash.backend.loyaltytransaction.entity.LoyaltyTransaction;
import com.autowash.backend.loyaltytransaction.repository.LoyaltyTransactionRepository;
import com.autowash.backend.payment.dto.RedeemRequestDTO;
import com.autowash.backend.payment.entity.Payment;
import com.autowash.backend.payment.repository.PaymentRepository;
import com.autowash.backend.payment.dto.RedeemResponseDTO;
import com.autowash.backend.reward.entity.Reward;
import com.autowash.backend.reward.repository.RewardRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class RedeemService {

    private final RewardRepository             rewardRepository;
    private final CustomerRepository           customerRepository;
    private final LoyaltyTransactionRepository loyaltyTransactionRepository;
    private final PaymentRepository            paymentRepository;

    @Transactional
    public RedeemResponseDTO redeem(RedeemRequestDTO dto) {

        // ── 1. Load và validate Reward ────────────────────────────────────────
        Reward reward = rewardRepository.findById(dto.getRewardId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Reward", "id", dto.getRewardId()));

        if (!Reward.RewardStatus.active.equals(reward.getStatus())) {
            throw new BusinessException(
                    "Reward đã bị vô hiệu hóa: id=" + dto.getRewardId(),
                    HttpStatus.CONFLICT);
        }

        // ── 2. Load và validate Customer ──────────────────────────────────────
        Customer customer = customerRepository.findById(dto.getCustomerId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Customer", "id", dto.getCustomerId()));

        if (!reward.isRedeemableBy(customer.getTotalPoints())) {
            throw new BusinessException(
                    String.format("Không đủ điểm để đổi reward. Cần %d điểm, hiện có %d điểm.",
                            reward.getRequiredPoints(), customer.getTotalPoints()),
                    HttpStatus.CONFLICT);
        }

        // ── 3. Load và validate Payment ───────────────────────────────────────
        // FIX: dùng findByBooking_BookingId vì Payment join qua object Booking (không có cột bookingId raw)
        Payment payment = paymentRepository.findByBooking_BookingId(dto.getBookingId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Payment", "bookingId", dto.getBookingId()));

        // FIX: kiểm tra reward object thay vì rewardId primitive
        if (payment.getReward() != null) {
            throw new BusinessException(
                    "Booking này đã được áp dụng reward (rewardId="
                            + payment.getReward().getRewardId() + "). Mỗi booking chỉ dùng 1 reward.",
                    HttpStatus.CONFLICT);
        }

        // ── 4. Trừ điểm khách hàng ────────────────────────────────────────────
        int balanceBefore = customer.getTotalPoints();
        int balanceAfter  = balanceBefore - reward.getRequiredPoints();

        customer.setTotalPoints(balanceAfter);
        customerRepository.save(customer);

        // ── 5. Tạo loyalty_transaction type = redeem ──────────────────────────
        LoyaltyTransaction tx = LoyaltyTransaction.builder()
                .customerId(customer.getCustomerId().longValue())   // FIX: Integer → Long
                .paymentId(payment.getPaymentId().longValue())      // FIX: Integer → Long
                .transactionType("redeem")                          // FIX: String field, không phải enum
                .points(-reward.getRequiredPoints())
                .balanceBefore(balanceBefore)
                .balanceAfter(balanceAfter)
                .note("Đổi " + reward.getRequiredPoints()
                        + " điểm lấy reward: " + reward.getRewardName())
                .build();

        LoyaltyTransaction savedTx = loyaltyTransactionRepository.save(tx);

        // ── 6. Gắn reward object vào payment ──────────────────────────────────
        // FIX: set cả object Reward thay vì setRewardId() vì entity dùng @ManyToOne
        payment.setReward(reward);
        paymentRepository.save(payment);

        log.info("Redeem thành công: customerId={}, rewardId={}, bookingId={}, txId={}",
                dto.getCustomerId(), dto.getRewardId(),
                dto.getBookingId(), savedTx.getLoyaltyTransactionId());

        // ── 7. Build response ─────────────────────────────────────────────────
        return RedeemResponseDTO.builder()
                .loyaltyTransactionId(savedTx.getLoyaltyTransactionId())
                .pointsDeducted(-reward.getRequiredPoints())
                .balanceBefore(balanceBefore)
                .balanceAfter(balanceAfter)
                .redeemedAt(savedTx.getCreatedAt())
                .rewardId(reward.getRewardId())
                .rewardName(reward.getRewardName())
                .rewardType(reward.getRewardType())
                .rewardValue(reward.getRewardValue())
                .bookingId(dto.getBookingId())
                .paymentId(payment.getPaymentId())
                .message(buildSuccessMessage(reward))
                .build();
    }

    private String buildSuccessMessage(Reward reward) {
        return switch (reward.getRewardType()) {
            case discount  -> String.format(
                    "Đổi điểm thành công! Bạn được giảm %s VND cho đơn rửa xe này.",
                    reward.getRewardValue().toPlainString());
            case free_wash ->
                    "Đổi điểm thành công! Lần rửa xe này hoàn toàn miễn phí.";
            case addon     -> String.format(
                    "Đổi điểm thành công! Dịch vụ bổ sung trị giá %s VND được thêm miễn phí.",
                    reward.getRewardValue().toPlainString());
        };
    }
}