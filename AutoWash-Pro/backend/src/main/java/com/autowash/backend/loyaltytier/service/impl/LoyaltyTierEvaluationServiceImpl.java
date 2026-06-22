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

import java.math.BigDecimal;
import java.util.List;
import java.util.Objects;

/**
 * Implementation xử lý logic phân hạng loyalty tier.
 *
 * Business rule:
 * Customer đạt một hạng nếu:
 * - totalVisits >= minVisits
 * AND
 * - currentPoints >= minPoints OR totalSpending >= minSpending
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
     * CUSTOMER tự đánh giá hạng của chính mình.
     *
     * Input là userId lấy từ JWT token.
     * Vì Customer liên kết User qua user_id nên phải tìm bằng findByUser_Id(userId).
     */
    @Override
    @Transactional
    public CustomerTierEvaluationResponseDTO evaluateCustomerTierByUserId(Integer userId) {
        Customer customer = customerRepository.findByUserId(userId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Customer khong ton tai voi userId = " + userId
                ));

        return evaluateCustomer(customer);
    }

    /**
     * ADMIN / STAFF / BRANCH_MANAGER đánh giá một customer cụ thể.
     *
     * Input là customerId, tức khóa chính customer.customer_id.
     * Vì vậy phải dùng findById(customerId), không dùng findByUserId.
     */
    @Override
    @Transactional
    public CustomerTierEvaluationResponseDTO evaluateCustomerTierByCustomerId(Integer customerId) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Customer khong ton tai, customerId = " + customerId
                ));

        return evaluateCustomer(customer);
    }

    /**
     * BRANCH_MANAGER / STAFF đánh giá toàn bộ customer thuộc chi nhánh.
     *
     * Lưu ý:
     * Customer entity hiện tại của bạn chưa có branchId, chỉ có brandId.
     * Nếu brandId đang được dùng như branchId thì hàm này chạy được.
     * Nếu DB có branch_id thật thì nên đổi brandId thành branchId trong Customer.
     */
    @Override
    @Transactional
    public List<CustomerTierEvaluationResponseDTO> evaluateCustomersByBranchId(Integer branchId) {
        return customerRepository.findByBrandId(branchId)
                .stream()
                .map(this::evaluateCustomer)
                .toList();
    }

    /**
     * ADMIN đánh giá lại hạng cho toàn bộ customer.
     */
    @Override
    @Transactional
    public List<CustomerTierEvaluationResponseDTO> evaluateAllCustomers() {
        return customerRepository.findAll()
                .stream()
                .map(this::evaluateCustomer)
                .toList();
    }

    /**
     * Hàm xử lý chung cho mọi loại input.
     *
     * Dù gọi bằng userId hay customerId thì cuối cùng cũng phải lấy ra Customer trước,
     * sau đó dùng customer.getCustomerId() để tính điểm, lượt, chi tiêu.
     */
    private CustomerTierEvaluationResponseDTO evaluateCustomer(Customer customer) {
        Integer customerId = customer.getCustomerId();

        Integer currentPoints = getCurrentPoints(customerId);
        Integer totalVisits = getTotalVisits(customer);
        BigDecimal totalSpending = getTotalSpending(customer);

        List<LoyaltyTier> activeTiers =
                loyaltyTierRepository.findByIsActiveTrueOrderByPriorityLevelDesc();

        if (activeTiers.isEmpty()) {
            throw new IllegalArgumentException("Chua co LoyaltyTier active trong he thong");
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
     * Tìm tier phù hợp nhất.
     *
     * activeTiers phải được sort theo priorityLevel giảm dần:
     * Platinum -> Gold -> Silver -> Member.
     */
    private LoyaltyTier findMatchedTier(
            List<LoyaltyTier> activeTiers,
            Integer currentPoints,
            Integer totalVisits,
            BigDecimal totalSpending
    ) {
        return activeTiers.stream()
                .filter(tier -> isMatchedShopeeStyle(
                        tier,
                        currentPoints,
                        totalVisits,
                        totalSpending
                ))
                .findFirst()
                .orElse(activeTiers.get(activeTiers.size() - 1));
    }

    /**
     * Logic match tier:
     * totalVisits >= minVisits
     * AND
     * (currentPoints >= minPoints OR totalSpending >= minSpending)
     */
    private boolean isMatchedShopeeStyle(
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

        boolean isDefaultTier = requiredVisits <= 0
                && requiredPoints <= 0
                && requiredSpending.compareTo(BigDecimal.ZERO) <= 0;

        if (isDefaultTier) {
            return true;
        }

        boolean enoughVisits = safeVisits >= requiredVisits;

        boolean enoughPoints = requiredPoints <= 0
                || safePoints >= requiredPoints;

        boolean enoughSpending = requiredSpending.compareTo(BigDecimal.ZERO) <= 0
                || safeSpending.compareTo(requiredSpending) >= 0;

        return enoughVisits && (enoughPoints || enoughSpending);
    }

    /**
     * Lấy điểm hiện tại của customer.
     *
     * Phải dùng customerId, không dùng userId.
     */
    private Integer getCurrentPoints(Integer customerId) {
        return loyaltyTransactionRepository
                .findTopByCustomerIdOrderByCreatedAtDesc(customerId)
                .map(LoyaltyTransaction::getBalanceAfter)
                .orElse(0);
    }

    private Integer getTotalVisits(Customer customer) {
        return customer.getTotalVisits() != null
                ? customer.getTotalVisits()
                : 0;
    }

    private BigDecimal getTotalSpending(Customer customer) {
        return customer.getTotalSpending() != null
                ? customer.getTotalSpending()
                : BigDecimal.ZERO;
    }

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