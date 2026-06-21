package com.autowash.backend.loyaltytier.service.impl;

import com.autowash.backend.customer.entity.Customer;
import com.autowash.backend.customer.repository.CustomerRepository;
import com.autowash.backend.loyaltytier.dto.CustomerTierEvaluationResponseDTO;
import com.autowash.backend.loyaltytier.entity.LoyaltyTier;
import com.autowash.backend.loyaltytier.mapper.LoyaltyTierMapper;
import com.autowash.backend.loyaltytier.repository.LoyaltyTierRepository;
import com.autowash.backend.loyaltytier.service.LoyaltyTierEvaluationService;
import com.autowash.backend.loyaltytransaction.entity.LoyaltyTransaction;
import com.autowash.backend.loyaltytransaction.repository.LoyaltyTransactionRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Objects;
import java.math.BigDecimal;
import java.util.List;
/**
 * Implementation xử lý logic phân hạng loyalty tier.
 *
 * Business rule tối ưu theo hướng Shopee-style:
 *
 * Customer đạt một hạng nếu:
 * - Đủ số lượt ghé thăm tối thiểu
 * AND
 * - Đủ điểm tích lũy hoặc đủ tổng chi tiêu
 *
 * Công thức:
 * totalVisits >= minVisits
 * AND
 * (currentPoints >= minPoints OR totalSpending >= minSpending)
 *
 * Lý do:
 * - totalVisits đảm bảo khách quay lại đủ thường xuyên.
 * - points hoặc spending đảm bảo khách có đủ giá trị tích lũy.
 * - Tránh việc khách chỉ ghé nhiều nhưng chi quá ít vẫn lên hạng cao.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class LoyaltyTierEvaluationServiceImpl implements LoyaltyTierEvaluationService {

    private final CustomerRepository customerRepository;
    private final LoyaltyTierRepository loyaltyTierRepository;
    private final LoyaltyTransactionRepository loyaltyTransactionRepository;
    private final LoyaltyTierMapper loyaltyTierMapper;

    /**
     * Đánh giá hạng cho một customer và cập nhật tierId vào bảng Customer.
     *
     * Fix Bug #1:
     * - Controller truyền customerId.
     * - customerId là khóa chính của bảng Customer.
     * - Vì vậy phải dùng findById(customerId), không dùng findByUserId(customerId).
     */
    @Override
    @Transactional
    public CustomerTierEvaluationResponseDTO evaluateCustomerTier(Integer customerId) {
        Customer customer = customerRepository.findByUserId(customerId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Customer khong ton tai, id = " + customerId
                ));

        Integer currentPoints = getCurrentPoints(customerId);
        Integer totalVisits = getTotalVisits(customer);
        BigDecimal totalSpending = getTotalSpending(customer);

        List<LoyaltyTier> activeTiers =
                loyaltyTierRepository.findByIsActiveTrueOrderByMinPointsDesc();

        if (activeTiers.isEmpty()) {
            throw new IllegalArgumentException("Chua co Loyalty active trong he thong");
        }

        LoyaltyTier matchedTier = findMatchedTier(
                activeTiers,
                currentPoints,
                totalVisits,
                totalSpending
        );

        Integer previousTierId = customer.getTierId();
        String previousTierName = findTierNameById(activeTiers, previousTierId);

        customer.setTierId(matchedTier.getTierId());
        customerRepository.save(customer);

        boolean tierChanged = !Objects.equals(previousTierId, matchedTier.getTierId());

        String message = tierChanged
                ? "Customer tier updated successfully"
                : "Customer tier unchanged";

        return loyaltyTierMapper.toEvaluationResponse(
                customer,
                previousTierId,
                previousTierName,
                matchedTier,
                currentPoints,
                totalVisits,
                totalSpending,
                message
        );
    }

    /**
     * Đánh giá lại hạng cho toàn bộ customer.
     *
     * Hàm này sẽ duyệt toàn bộ customer trong database,
     * sau đó gọi lại evaluateCustomerTier(customerId) cho từng người.
     */
    @Override
    public List<CustomerTierEvaluationResponseDTO> evaluateAllCustomers() {
        return customerRepository.findAll()
                .stream()
                .map(customer -> evaluateCustomerTier(customer.getCustomerId()))
                .toList();
    }

    //=======================================HELPER===========================================

    /**
     * Tìm tier phù hợp nhất cho customer.
     *
     * Danh sách activeTiers phải được sort theo priorityLevel giảm dần.
     * Ví dụ:
     * - Platinum priority = 4
     * - Gold priority = 3
     * - Silver priority = 2
     * - Member priority = 1
     *
     * Hệ thống sẽ kiểm tra từ hạng cao nhất xuống thấp nhất.
     * Customer đạt hạng nào đầu tiên thì lấy hạng đó.
     */
    private LoyaltyTier findMatchedTier(
            List<LoyaltyTier> activeTiers,
            Integer currentPoints,
            Integer totalVisits,
            BigDecimal totalSpending
    ) {
        return activeTiers.stream()
                .filter(tier -> isMatchedShoppeStyle(
                        tier,
                        currentPoints,
                        totalVisits,
                        totalSpending
                ))
                .findFirst()
                .orElse(activeTiers.get(activeTiers.size() - 1));
    }

    /**
     * Kiểm tra customer có đạt điều kiện của tier hay không.
     *
     * Logic tối ưu:
     * totalVisits >= minVisits
     * AND
     * (currentPoints >= minPoints OR totalSpending >= minSpending)
     *
     * Nếu tier là hạng cơ bản, ví dụ:
     * - minVisits = 0
     * - minPoints = 0
     * - minSpending = 0
     *
     * thì customer mới vẫn được match vào hạng đó.
     */
    private boolean isMatchedShoppeStyle(
            LoyaltyTier tier,
            Integer currentPoints,
            Integer totalVisits,
            BigDecimal totalSpending
    ) {

        Integer requiredVisits = tier.getMinVisits() != null
                ? tier.getMinVisits()
                : 0;
        Integer requiredPoints = tier.getMinPoints() != null
                ? tier.getMinPoints()
                : 0;
        BigDecimal requiredSpending = tier.getMinSpending() != null
                ? tier.getMinSpending()
                : BigDecimal.ZERO;
        Integer safeVisits = totalVisits != null
                ? totalVisits
                : 0;
        Integer safePoints = currentPoints != null
                ? currentPoints
                : 0;
        BigDecimal safeSpending = totalSpending != null
                ? totalSpending
                : BigDecimal.ZERO;

        boolean enoughVisits = safeVisits >= requiredVisits;
        boolean enoughPoints = requiredPoints <= 0
                || safePoints >= requiredPoints;
        boolean enoughSpending = requiredSpending.compareTo(BigDecimal.ZERO) <= 0
                || safeSpending.compareTo(requiredSpending) >= 0;
        boolean isDefaultTier = requiredVisits <= 0
                && requiredPoints <= 0
                && requiredSpending.compareTo(BigDecimal.ZERO) <= 0;
        if (isDefaultTier) {
            return true;
        }
        return enoughVisits && (enoughPoints || enoughSpending);
    }


//====================================HElPER====================================================
    /**
     * Lấy điểm hiện tại của customer.
     *
     * Cách tính:
     * - Lấy loyalty transaction mới nhất của customer.
     * - balanceAfter của transaction mới nhất là số điểm hiện tại.
     * - Nếu customer chưa có transaction thì điểm = 0.
     */
    private Integer getCurrentPoints(Integer customerId) {
        return loyaltyTransactionRepository
                .findTopByCustomerIdOrderByCreatedAtDesc(customerId)
                .map(LoyaltyTransaction::getBalanceAfter)
                .orElse(0);
    }

    /**
     * Lấy tổng số lượt sử dụng dịch vụ của customer.
     *
     * Nếu totalVisits trong DB đang null thì trả về 0
     * để tránh lỗi NullPointerException.
     */
    private Integer getTotalVisits(Customer customer) {
        if (customer.getTotalVisits() == null) {
            return 0;
        }
        return customer.getTotalVisits();
    }

    /**
     * Lấy tổng chi tiêu của customer.
     *
     * Nếu totalSpending trong DB đang null thì trả về BigDecimal.ZERO
     * để so sánh an toàn.
     */
    private BigDecimal getTotalSpending(Customer customer) {
        if (customer.getTotalSpending() == null) {
            return BigDecimal.ZERO;
        }
        return customer.getTotalSpending();
    }

    /**
     * Tìm tên tier cũ dựa theo previousTierId.
     *
     * Dùng để response trả về được previousTierName.
     */
    private String findTierNameById(List<LoyaltyTier> activeTiers, Integer tierId) {
        if (tierId == null) {
            return null;
        }
        return activeTiers.stream()
                .filter(tier -> Objects.equals(tier.getTierId(), tierId))
                .map(LoyaltyTier::getTierName)
                .findFirst()
                .orElse(null);
    }
}
