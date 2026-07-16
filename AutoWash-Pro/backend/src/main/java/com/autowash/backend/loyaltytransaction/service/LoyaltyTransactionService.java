package com.autowash.backend.loyaltytransaction.service;

import com.autowash.backend.booking.entity.Booking;
import com.autowash.backend.loyaltytransaction.dto.LoyaltyBalanceResponseDTO;
import com.autowash.backend.loyaltytransaction.dto.LoyaltyTransactionResponseDTO;

import java.math.BigDecimal;
import java.util.List;

public interface LoyaltyTransactionService {
    /**
     * Cộng điểm khi booking đã hoàn thành.
     */

    LoyaltyTransactionResponseDTO earnPointsFromCompleteBooking (
            Booking booking,
            BigDecimal bookingAmount
    );

    /**
     * Lấy lịch sử giao dịch điểm của customer.
     * Nếu transactionType = null hoặc rỗng thì lấy tất cả.
     */
    List<LoyaltyTransactionResponseDTO> getCustomerTransactions(
            Integer customerId,
            String transactionType
    );

    /**
     * CUSTOMER xem lịch sử giao dịch của chính mình.
     */
    List<LoyaltyTransactionResponseDTO> getMyTransactions(Integer userId, String transactionType);

    /**
     * Lấy số điểm hiện tại của customer.
     */
    LoyaltyBalanceResponseDTO getCustomerBalance(Integer customerId);

    /**
     * CUSTOMER xem số dư điểm của chính mình.
     */
    LoyaltyBalanceResponseDTO getMyBalance(Integer userId);
}
