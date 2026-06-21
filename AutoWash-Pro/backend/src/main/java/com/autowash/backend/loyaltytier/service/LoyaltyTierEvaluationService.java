package com.autowash.backend.loyaltytier.service;

import com.autowash.backend.loyaltytier.dto.CustomerTierEvaluationResponseDTO;

import java.util.List;

/**
 * Service interface định nghĩa các chức năng đánh giá và cập nhật hạng thành viên.
 *
 * Nhiệm vụ chính:
 * - Đánh giá hạng loyalty tier cho một customer.
 * - Đánh giá lại hạng cho toàn bộ customer trong hệ thống.
 *
 * Việc tách interface giúp Controller phụ thuộc vào abstraction,
 * dễ test và dễ thay đổi implementation sau này.
 */
public interface LoyaltyTierEvaluationService {

    /**
     * Đánh giá và cập nhật hạng loyalty tier cho một customer.
     *
     * @param customerId ID của customer trong bảng Customer.
     * @return kết quả đánh giá gồm hạng cũ, hạng mới, điểm, số lượt và tổng chi tiêu.
     */
    CustomerTierEvaluationResponseDTO evaluateCustomerTier(Integer customerId);

    /**
     * Đánh giá lại hạng loyalty tier cho tất cả customer.
     *
     * @return danh sách kết quả đánh giá của toàn bộ customer.
     */
    List<CustomerTierEvaluationResponseDTO> evaluateAllCustomers();
}
