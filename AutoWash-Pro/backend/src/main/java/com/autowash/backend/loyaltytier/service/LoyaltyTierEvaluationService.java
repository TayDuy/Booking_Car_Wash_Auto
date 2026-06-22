package com.autowash.backend.loyaltytier.service;

import com.autowash.backend.loyaltytier.dto.CustomerTierEvaluationResponseDTO;

import java.util.List;

/**
 * Service interface định nghĩa các chức năng đánh giá hạng thành viên.
 *
 * Nhiệm vụ:
 * - CUSTOMER tự đánh giá hạng của chính mình bằng userId lấy từ JWT.
 * - ADMIN / STAFF / BRANCH_MANAGER đánh giá hạng cho 1 customer bằng customerId.
 * - ADMIN đánh giá lại hạng cho toàn bộ customer.
 * - BRANCH_MANAGER / STAFF đánh giá lại hạng cho customer thuộc chi nhánh.
 *
 * Controller sẽ gọi interface này, không gọi trực tiếp class implementation.
 */
public interface LoyaltyTierEvaluationService {

    /**
     * CUSTOMER tự đánh giá và cập nhật hạng của chính mình.
     *
     * Dùng userId từ bảng account/user, thường lấy từ JWT token.
     *
     * @param userId ID của user trong bảng account/user.
     * @return kết quả gồm hạng cũ, hạng mới, điểm, lượt ghé thăm, tổng chi tiêu.
     */
    CustomerTierEvaluationResponseDTO evaluateCustomerTierByUserId(Integer userId);

    /**
     * ADMIN / STAFF / BRANCH_MANAGER đánh giá và cập nhật hạng cho 1 customer cụ thể.
     *
     * Dùng customerId từ bảng customer.
     *
     * @param customerId ID của customer trong bảng customer.
     * @return kết quả gồm hạng cũ, hạng mới, điểm, lượt ghé thăm, tổng chi tiêu.
     */
    CustomerTierEvaluationResponseDTO evaluateCustomerTierByCustomerId(Integer customerId);

    /**
     * BRANCH_MANAGER / STAFF đánh giá lại hạng cho toàn bộ customer thuộc một chi nhánh.
     *
     * @param branchId ID của chi nhánh.
     * @return danh sách kết quả đánh giá của các customer thuộc chi nhánh.
     */
    List<CustomerTierEvaluationResponseDTO> evaluateCustomersByBranchId(Integer branchId);

    /**
     * ADMIN đánh giá lại hạng cho toàn bộ customer trong hệ thống.
     *
     * Hàm này dùng cho:
     * - Admin chạy thủ công.
     * - Scheduler chạy tự động hàng tháng.
     *
     * @return danh sách kết quả đánh giá của toàn bộ customer.
     */
    List<CustomerTierEvaluationResponseDTO> evaluateAllCustomers();
}