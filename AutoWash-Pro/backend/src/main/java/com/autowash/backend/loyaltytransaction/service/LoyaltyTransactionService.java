package com.autowash.backend.loyaltytransaction.service;

import com.autowash.backend.loyaltytransaction.dto.LoyaltyBalanceResponseDTO;
import com.autowash.backend.loyaltytransaction.dto.LoyaltyTransactionResponseDTO;

import java.util.List;

public interface LoyaltyTransactionService {

    /**
     * Lấy lịch sử giao dịch điểm của customer.
     * Nếu transactionType = null hoặc rỗng thì lấy tất cả.
     */
    List<LoyaltyTransactionResponseDTO> getCustomerTransactions(
            Integer customerId,
            String transactionType
    );

    /**
     * Lấy số điểm hiện tại của customer.
     */
    LoyaltyBalanceResponseDTO getCustomerBalance(Integer customerId);
}
