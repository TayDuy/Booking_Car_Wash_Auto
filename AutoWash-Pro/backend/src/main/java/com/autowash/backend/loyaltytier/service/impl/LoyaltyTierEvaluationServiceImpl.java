package com.autowash.backend.loyaltytier.service.impl;

import com.autowash.backend.customer.entity.Customer;
import com.autowash.backend.customer.repository.CustomerRepository;
import com.autowash.backend.loyaltytier.dto.CustomerTierEvaluationResponseDTO;
import com.autowash.backend.loyaltytier.entity.LoyaltyTier;
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
 * Implementation xử lý logic đánh giá hạng thành viên loyalty tier.
 *
 * Luồng xử lý chính:
 * 1. Tìm customer theo customerId.
 * 2. Lấy điểm hiện tại từ bảng LoyaltyTransaction.
 * 3. Lấy totalVisits và totalSpending từ Customer.
 * 4. Lấy danh sách LoyaltyTier đang active, sắp xếp từ hạng cao xuống thấp.
 * 5. Tìm hạng phù hợp theo điều kiện OR:
 *    - Đủ điểm, hoặc
 *    - Đủ số lượt rửa xe, hoặc
 *    - Đủ tổng chi tiêu.
 * 6. Cập nhật tierId mới vào Customer.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class LoyaltyTierEvaluationServiceImpl implements LoyaltyTierEvaluationService {

    private final CustomerRepository customerRepository;
    private final LoyaltyTierRepository loyaltyTierRepository;
    private final LoyaltyTransactionRepository loyaltyTransactionRepository;

    /**
     * Đánh giá và cập nhật hạng cho một customer.
     *
     * Lưu ý fix Bug #1:
     * - customerId là ID của bảng Customer.
     * - Không dùng findByUserId(customerId), vì userId và customerId là 2 cột khác nhau.
     */
    @Override
    @Transactional
    public CustomerTierEvaluationResponseDTO evaluateCustomerTier(Integer customerId) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Customer không tồn tại, id=" + customerId
                ));

        Integer currentPoints = getCurrentPoints(customerId);
        Integer totalVisits = getTotalVisits(customer);
        BigDecimal totalSpending = getTotalSpending(customer);

        List<LoyaltyTier> activeTiers =
                loyaltyTierRepository.findByIsActiveTrueOrderByPriorityLevelDesc();

        if (activeTiers.isEmpty()) {
            throw new IllegalArgumentException("Chưa có LoyaltyTier active trong hệ thống");
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

        return new CustomerTierEvaluationResponseDTO(
                customer.getCustomerId(),
                previousTierId,
                previousTierName,
                matchedTier.getTierId(),
                matchedTier.getTierName(),
                currentPoints,
                totalVisits,
                totalSpending,
                message
        );
    }

    /**
     * Đánh giá lại hạng cho toàn bộ customer.
     *
     * Hàm này thường dùng cho:
     * - Admin chạy thủ công.
     * - Scheduler chạy tự động hằng tháng.
     */
    @Override
    @Transactional
    public List<CustomerTierEvaluationResponseDTO> evaluateAllCustomers() {
        return customerRepository.findAll()
                .stream()
                .map(customer -> evaluateCustomerTier(customer.getCustomerId()))
                .toList();
    }

    /**
     * Tìm loyalty tier phù hợp nhất cho customer.
     *
     * Fix Bug #3:
     * Logic cũ dùng AND:
     * - Phải đủ điểm
     * - Và đủ lượt
     * - Và đủ chi tiêu
     *
     * Logic mới dùng OR:
     * - Chỉ cần đạt một trong ba điều kiện là được lên hạng.
     *
     * Vì danh sách activeTiers đã được sort theo priorityLevel DESC,
     * hệ thống sẽ kiểm tra hạng cao trước.
     */
    private LoyaltyTier findMatchedTier(
            List<LoyaltyTier> activeTiers,
            Integer currentPoints,
            Integer totalVisits,
            BigDecimal totalSpending
    ) {
        return activeTiers.stream()
                .filter(tier -> isMatchedByAnyCondition(
                        tier,
                        currentPoints,
                        totalVisits,
                        totalSpending
                ))
                .findFirst()
                .orElse(activeTiers.get(activeTiers.size() - 1));
    }

    /**
     * Kiểm tra customer có đạt bất kỳ điều kiện nào của tier hay không.
     *
     * Điều kiện đạt:
     * - currentPoints >= minPoints
     * - hoặc totalVisits >= minVisits
     * - hoặc totalSpending >= minSpending
     *
     * Nếu tier không có yêu cầu nào, ví dụ Bronze min = 0,
     * thì tier đó được xem là tier mặc định.
     */
    private boolean isMatchedByAnyCondition(
            LoyaltyTier tier,
            Integer currentPoints,
            Integer totalVisits,
            BigDecimal totalSpending
    ) {
        boolean matchedByPoints = tier.getMinPoints() != null
                && tier.getMinPoints() > 0
                && currentPoints != null
                && currentPoints >= tier.getMinPoints();

        boolean matchedByVisits = tier.getMinVisits() != null
                && tier.getMinVisits() > 0
                && totalVisits != null
                && totalVisits >= tier.getMinVisits();

        boolean matchedBySpending = tier.getMinSpending() != null
                && tier.getMinSpending().compareTo(BigDecimal.ZERO) > 0
                && totalSpending != null
                && totalSpending.compareTo(tier.getMinSpending()) >= 0;

        boolean hasNoRequirement =
                (tier.getMinPoints() == null || tier.getMinPoints() <= 0)
                        && (tier.getMinVisits() == null || tier.getMinVisits() <= 0)
                        && (tier.getMinSpending() == null
                        || tier.getMinSpending().compareTo(BigDecimal.ZERO) <= 0);

        return matchedByPoints
                || matchedByVisits
                || matchedBySpending
                || hasNoRequirement;
    }

    /**
     * Lấy điểm hiện tại của customer.
     *
     * Cách lấy:
     * - Tìm giao dịch loyalty mới nhất của customer.
     * - Lấy balanceAfter làm số điểm hiện tại.
     * - Nếu chưa có transaction nào thì điểm = 0.
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
     * Nếu totalVisits đang null trong DB thì trả về 0
     * để tránh lỗi NullPointerException.
     */
    private Integer getTotalVisits(Customer customer) {
        if (customer.getTotalVisits() == null) {
            return 0;
        }

        return customer.getTotalVisits();
    }

    /**
     * Lấy tổng số tiền customer đã chi tiêu.
     *
     * Nếu totalSpending đang null trong DB thì trả về BigDecimal.ZERO
     * để so sánh an toàn.
     */
    private BigDecimal getTotalSpending(Customer customer) {
        if (customer.getTotalSpending() == null) {
            return BigDecimal.ZERO;
        }

        return customer.getTotalSpending();
    }

    /**
     * Tìm tên tier cũ dựa trên tierId.
     *
     * Dùng để response trả ra được previousTierName.
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
