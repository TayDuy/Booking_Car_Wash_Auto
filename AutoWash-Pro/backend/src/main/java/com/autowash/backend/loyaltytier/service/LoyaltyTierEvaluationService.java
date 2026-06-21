package com.autowash.backend.loyaltytier.service;

import com.autowash.backend.loyaltytier.dto.CustomerTierEvaluationResponseDTO;

import java.util.List;

/**
 * Service interface định nghĩa các chức năng đánh giá hạng thành viên.
 *
 * Nhiệm vụ:
 * - Đánh giá hạng cho 1 customer.
 * - Đánh giá lại hạng cho toàn bộ customer.
 *
 * Controller sẽ gọi interface này, không gọi trực tiếp class implementation.
 */
public interface LoyaltyTierEvaluationService {

    /**
     * Đánh giá và cập nhật hạng thành viên cho 1 customer.
     *
     * @param customerId ID của customer trong bảng Customer.
     * @return kết quả gồm hạng cũ, hạng mới, điểm, lượt ghé thăm, tổng chi tiêu.
     */
    CustomerTierEvaluationResponseDTO evaluateCustomerTier(Integer customerId);

    /**
     * Đánh giá lại hạng cho toàn bộ customer trong hệ thống.

     * Hàm này dùng cho:
     * - Admin chạy thủ công.
     * - Scheduler chạy tự động hàng tháng.
     *
     * @return danh sách kết quả đánh giá của toàn bộ customer.
     */
    List<CustomerTierEvaluationResponseDTO> evaluateAllCustomers();
}