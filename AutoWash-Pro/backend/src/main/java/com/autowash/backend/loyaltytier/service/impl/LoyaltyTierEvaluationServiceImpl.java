package com.autowash.backend.loyaltytier.service.impl;

import com.autowash.backend.customer.entity.Customer;
import com.autowash.backend.customer.repository.CustomerRepository;
import com.autowash.backend.customerreward.entity.CustomerReward;
import com.autowash.backend.loyaltytier.dto.CustomerTierEvaluationResponseDTO;
import com.autowash.backend.loyaltytier.dto.CustomerTierResponseDTO;
import com.autowash.backend.loyaltytier.entity.LoyaltyTier;
import com.autowash.backend.loyaltytier.mapper.LoyaltyTierMapper;
import com.autowash.backend.loyaltytier.repository.LoyaltyTierRepository;
import com.autowash.backend.loyaltytier.service.LoyaltyTierEvaluationService;
import com.autowash.backend.loyaltytransaction.entity.LoyaltyTransaction;
import com.autowash.backend.loyaltytransaction.repository.LoyaltyTransactionRepository;
import com.autowash.backend.reward.entity.Reward;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

/**
 * Implementation xử lý logic phân hạng loyalty tier.
 *
 * Business rule:
 * Customer đạt một hạng nếu:
 * - totalVisits >= minVisits
 * AND
 * - currentPoints >= minPoints OR totalSpending >= minSpending
 *
 * ============================================================================
 * TỐI ƯU N+1 QUERY (so với bản gốc)
 * ============================================================================
 * Bản gốc: mỗi khi đánh giá 1 customer, code query lại TOÀN BỘ:
 *   - danh sách loyalty_tier active (giống nhau cho mọi customer)
 *   - danh sách reward theo từng tier (giống nhau cho mọi customer)
 *   - kiểm tra từng voucher đã tồn tại chưa (1 query / reward / customer)
 * => Với N customer và M reward, số query có thể lên tới N * M * 2 lần.
 *
 * Bản sửa:
 *   - activeTiers: load 1 lần duy nhất cho cả batch, dùng chung.
 *   - rewardsByTierLevel: load 1 lần duy nhất cho cả batch (Map<tierLevel, List<Reward>>).
 *   - voucher hiện có của customer: load 1 lần / customer (thay vì 1 lần / reward / customer),
 *     sau đó kiểm tra trong bộ nhớ (in-memory) bằng Set. Dùng method có sẵn
 *     findByCustomer_CustomerIdOrderByRedeemedAtDesc trong CustomerRewardRepository,
 *     không cần thêm method mới.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class LoyaltyTierEvaluationServiceImpl implements LoyaltyTierEvaluationService {

    private final CustomerRepository customerRepository;
    private final LoyaltyTierRepository loyaltyTierRepository;
    private final LoyaltyTransactionRepository loyaltyTransactionRepository;
    private final LoyaltyTierMapper loyaltyTierMapper;
    private final com.autowash.backend.reward.repository.RewardRepository rewardRepository;
    private final com.autowash.backend.customerreward.repository.CustomerRewardRepository customerRewardRepository;

    @Override
    @Transactional(readOnly = true)
    public CustomerTierResponseDTO getCustomerTierByUserId(Integer userId) {
        Customer customer = customerRepository.findByUser_Id(userId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Customer khong ton tai voi userId = " + userId
                ));

        String tierName = null;
        if (customer.getTierId() != null) {
            LoyaltyTier tier = loyaltyTierRepository.findById(customer.getTierId()).orElse(null);
            tierName = tier != null ? tier.getTierName() : null;
        }

        Integer currentBalance = loyaltyTransactionRepository
                .findTopByCustomerIdOrderByCreatedAtDesc(customer.getCustomerId())
                .map(LoyaltyTransaction::getBalanceAfter)
                .orElse(0);

        return CustomerTierResponseDTO.builder()
                .customerId(customer.getCustomerId())
                .tierId(customer.getTierId())
                .tierName(tierName)
                .currentPoints(customer.getTotalPoints())
                .currentBalance(currentBalance)
                .totalVisits(customer.getTotalVisits())
                .totalSpending(customer.getTotalSpending())
                .build();
    }

    /**
     * CUSTOMER tự đánh giá hạng của chính mình.
     * (Chỉ đánh giá 1 customer -> không cần cache, load trực tiếp là đủ.)
     */
    @Override
    @Transactional
    public CustomerTierEvaluationResponseDTO evaluateCustomerTierByUserId(Integer userId) {
        Customer customer = customerRepository.findByUser_Id(userId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Customer khong ton tai voi userId = " + userId
                ));

        List<LoyaltyTier> activeTiers = loadActiveTiersOrThrow();
        Map<Integer, List<Reward>> rewardsByTierLevel = loadRewardsByTierLevel(activeTiers);

        return evaluateCustomer(customer, activeTiers, rewardsByTierLevel);
    }

    /**
     * ADMIN / STAFF / BRANCH_MANAGER đánh giá một customer cụ thể.
     */
    @Override
    @Transactional
    public CustomerTierEvaluationResponseDTO evaluateCustomerTierByCustomerId(Integer customerId) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Customer khong ton tai, customerId = " + customerId
                ));

        List<LoyaltyTier> activeTiers = loadActiveTiersOrThrow();
        Map<Integer, List<Reward>> rewardsByTierLevel = loadRewardsByTierLevel(activeTiers);

        return evaluateCustomer(customer, activeTiers, rewardsByTierLevel);
    }

    /**
     * BRANCH_MANAGER / STAFF đánh giá toàn bộ customer thuộc chi nhánh.
     *
     * ĐÃ SỬA N+1: activeTiers và rewardsByTierLevel load 1 LẦN cho cả danh sách,
     * không load lại theo từng customer.
     */
    @Override
    @Transactional
    public List<CustomerTierEvaluationResponseDTO> evaluateCustomersByBranchId(Integer branchId) {
        List<LoyaltyTier> activeTiers = loadActiveTiersOrThrow();
        Map<Integer, List<Reward>> rewardsByTierLevel = loadRewardsByTierLevel(activeTiers);

        return customerRepository.findByBrandId(branchId)
                .stream()
                .map(customer -> evaluateCustomer(customer, activeTiers, rewardsByTierLevel))
                .toList();
    }

    /**
     * ADMIN đánh giá lại hạng cho toàn bộ customer.
     *
     * ĐÃ SỬA N+1: activeTiers và rewardsByTierLevel load 1 LẦN cho cả danh sách,
     * không load lại theo từng customer. Đây là chỗ chạy lúc app khởi động
     * (DatabaseMigrationRunner) nên tối ưu ở đây ảnh hưởng trực tiếp tới thời
     * gian start-up.
     */
    @Override
    @Transactional
    public List<CustomerTierEvaluationResponseDTO> evaluateAllCustomers() {
        List<LoyaltyTier> activeTiers = loadActiveTiersOrThrow();
        Map<Integer, List<Reward>> rewardsByTierLevel = loadRewardsByTierLevel(activeTiers);

        return customerRepository.findAll()
                .stream()
                .map(customer -> evaluateCustomer(customer, activeTiers, rewardsByTierLevel))
                .toList();
    }

    // ========================================================================
    // Helper load dữ liệu dùng chung (cache trong 1 lượt đánh giá batch)
    // ========================================================================

    private List<LoyaltyTier> loadActiveTiersOrThrow() {
        List<LoyaltyTier> activeTiers = loyaltyTierRepository.findByIsActiveTrueOrderByPriorityLevelDesc();
        if (activeTiers.isEmpty()) {
            throw new IllegalArgumentException("Chua co LoyaltyTier active trong he thong");
        }
        return activeTiers;
    }

    /**
     * Load sẵn reward theo từng priorityLevel (>1) của các tier active,
     * thay vì query riêng cho từng tier mỗi khi đánh giá 1 customer.
     */
    private Map<Integer, List<Reward>> loadRewardsByTierLevel(List<LoyaltyTier> activeTiers) {
        Map<Integer, List<Reward>> rewardsByTierLevel = new HashMap<>();
        for (LoyaltyTier tier : activeTiers) {
            int level = tier.getPriorityLevel();
            if (level <= 1) {
                continue; // priorityLevel <= 1 (Member mặc định) không có reward mở khóa
            }
            List<Reward> rewards = rewardRepository.findByRequiredTierLevelAndStatus(
                    level, Reward.RewardStatus.active);
            rewardsByTierLevel.put(level, rewards);
        }
        return rewardsByTierLevel;
    }

    // ========================================================================
    // Logic đánh giá 1 customer (dùng dữ liệu cache truyền vào, không tự query)
    // ========================================================================

    private CustomerTierEvaluationResponseDTO evaluateCustomer(
            Customer customer,
            List<LoyaltyTier> activeTiers,
            Map<Integer, List<Reward>> rewardsByTierLevel
    ) {
        Integer customerId = customer.getCustomerId();

        Integer lifetimePoints = getLifetimePoints(customer);
        Integer currentBalance = getCurrentBalance(customerId);
        Integer totalVisits = getTotalVisits(customer);
        BigDecimal totalSpending = getTotalSpending(customer);

        LoyaltyTier matchedTier = findMatchedTier(activeTiers, totalVisits, totalSpending);

        Integer previousTierId = customer.getTierId();
        String previousTierName = findTierNameById(activeTiers, previousTierId);

        customer.setTierId(matchedTier.getTierId());
        customerRepository.save(customer);

        boolean tierChanged = !Objects.equals(previousTierId, matchedTier.getTierId());

        int previousPriorityLevel = activeTiers.stream()
                .filter(t -> Objects.equals(t.getTierId(), previousTierId))
                .findFirst()
                .map(LoyaltyTier::getPriorityLevel)
                .orElse(1); // mặc định Member (priorityLevel = 1) nếu previousTierId null

        awardUnlockedRewardsIfNeeded(
                customer,
                customerId,
                activeTiers,
                rewardsByTierLevel,
                matchedTier,
                previousPriorityLevel
        );

        String message = tierChanged
                ? "Customer tier updated successfully"
                : "Customer tier unchanged";

        return loyaltyTierMapper.toEvaluationResponse(
                customer,
                previousTierId,
                previousTierName,
                matchedTier,
                lifetimePoints,
                currentBalance,
                totalVisits,
                totalSpending,
                message
        );
    }

    /**
     * Phát voucher thăng hạng nếu đủ điều kiện.
     *
     * ĐÃ SỬA N+1: thay vì query customer_reward riêng cho TỪNG reward
     * (existsByCustomer_CustomerIdAndReward_RewardIdAndRedeemedPointsAndStatus /
     *  existsByCustomer_CustomerIdAndReward_RewardId), giờ chỉ load TOÀN BỘ
     * voucher hiện có của customer này (1 query duy nhất), rồi kiểm tra bằng Set
     * trong bộ nhớ.
     */
    private void awardUnlockedRewardsIfNeeded(
            Customer customer,
            Integer customerId,
            List<LoyaltyTier> activeTiers,
            Map<Integer, List<Reward>> rewardsByTierLevel,
            LoyaltyTier matchedTier,
            int previousPriorityLevel
    ) {
        // 1 query duy nhất lấy hết voucher hiện có của customer này
        // (dùng method có sẵn trong CustomerRewardRepository, không cần thêm method mới)
        List<CustomerReward> existingRewards =
                customerRewardRepository.findByCustomer_CustomerIdOrderByRedeemedAtDesc(customerId);

        // rewardId đã từng nhận (bất kỳ trạng thái nào)
        Set<Integer> receivedRewardIds = new HashSet<>();
        // rewardId đang có voucher UNUSED, redeemedPoints = 0 (voucher thăng hạng chưa dùng)
        Set<Integer> unusedZeroPointRewardIds = new HashSet<>();

        for (CustomerReward cr : existingRewards) {
            if (cr.getReward() == null) {
                continue;
            }
            Integer rewardId = cr.getReward().getRewardId();
            receivedRewardIds.add(rewardId);

            boolean isZeroPoint = cr.getRedeemedPoints() != null && cr.getRedeemedPoints() == 0;
            boolean isUnused = "UNUSED".equals(cr.getStatus());
            if (isZeroPoint && isUnused) {
                unusedZeroPointRewardIds.add(rewardId);
            }
        }

        for (LoyaltyTier tier : activeTiers) {
            if (tier.getPriorityLevel() > matchedTier.getPriorityLevel()
                    || tier.getPriorityLevel() <= 1) {
                continue;
            }

            List<Reward> unlockedRewards = rewardsByTierLevel.getOrDefault(tier.getPriorityLevel(), List.of());

            for (Reward reward : unlockedRewards) {
                boolean shouldAward;

                if (tier.getPriorityLevel() > previousPriorityLevel) {
                    // TRƯỜNG HỢP A: THĂNG HẠNG mới hoặc THĂNG HẠNG LẠI (Upgrade/Re-upgrade)
                    boolean alreadyHasUnused = unusedZeroPointRewardIds.contains(reward.getRewardId());
                    shouldAward = !alreadyHasUnused;
                } else {
                    // TRƯỜNG HỢP B: GIỮ HẠNG (Non-upgrade) hoặc QUÉT BÙ ĐẮP TÀI KHOẢN CŨ
                    boolean alreadyReceived = receivedRewardIds.contains(reward.getRewardId());
                    shouldAward = !alreadyReceived;
                }

                if (shouldAward) {
                    CustomerReward voucher = CustomerReward.builder()
                            .customer(customer)
                            .reward(reward)
                            .voucherCode("VOU-TIER-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                            .status("UNUSED")
                            .redeemedPoints(0)
                            .discountType(reward.getRewardType().name())
                            .discountValue(reward.getRewardValue())
                            .redeemedAt(LocalDateTime.now())
                            .expiredAt(LocalDateTime.now().plusDays(30))
                            .build();
                    customerRewardRepository.save(voucher);

                    // Cập nhật cache trong bộ nhớ để tránh phát trùng nếu vòng lặp
                    // sau (tier khác) lại chạm cùng reward trong CÙNG 1 lần đánh giá.
                    receivedRewardIds.add(reward.getRewardId());
                    unusedZeroPointRewardIds.add(reward.getRewardId());
                }
            }
        }
    }

    private Integer getLifetimePoints(Customer customer) {
        return customer.getTotalPoints() != null ? customer.getTotalPoints() : 0;
    }

    private Integer getCurrentBalance(Integer customerId) {
        return loyaltyTransactionRepository
                .findTopByCustomerIdOrderByCreatedAtDesc(customerId)
                .map(LoyaltyTransaction::getBalanceAfter)
                .orElse(0);
    }

    /**
     * Tìm tier phù hợp nhất.
     * activeTiers phải được sort theo priorityLevel giảm dần:
     * Platinum -> Gold -> Silver -> Member.
     */
    private LoyaltyTier findMatchedTier(
            List<LoyaltyTier> activeTiers,
            Integer totalVisits,
            BigDecimal totalSpending
    ) {
        return activeTiers.stream()
                .filter(tier -> isMatchedShopeeStyle(tier, totalVisits, totalSpending))
                .findFirst()
                .orElse(activeTiers.get(activeTiers.size() - 1));
    }

    /**
     * Logic match tier:
     * totalVisits >= minVisits OR totalSpending >= minSpending
     */
    private boolean isMatchedShopeeStyle(
            LoyaltyTier tier,
            Integer totalVisits,
            BigDecimal totalSpending
    ) {
        Integer requiredVisits = tier.getMinVisits() != null ? tier.getMinVisits() : 0;
        BigDecimal requiredSpending = tier.getMinSpending() != null ? tier.getMinSpending() : BigDecimal.ZERO;

        Integer safeVisits = totalVisits != null ? totalVisits : 0;
        BigDecimal safeSpending = totalSpending != null ? totalSpending : BigDecimal.ZERO;

        boolean isDefaultTier = requiredVisits <= 0 && requiredSpending.compareTo(BigDecimal.ZERO) <= 0;
        if (isDefaultTier) {
            return true;
        }

        boolean enoughVisits = safeVisits >= requiredVisits;
        boolean enoughSpending = safeSpending.compareTo(requiredSpending) >= 0;

        // Giai đoạn đầu: dùng OR để tránh làm sụt hạng sốc khách hàng cũ
        return enoughVisits || enoughSpending;
    }

    private Integer getTotalVisits(Customer customer) {
        return customer.getTotalVisits() != null ? customer.getTotalVisits() : 0;
    }

    private BigDecimal getTotalSpending(Customer customer) {
        return customer.getTotalSpending() != null ? customer.getTotalSpending() : BigDecimal.ZERO;
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