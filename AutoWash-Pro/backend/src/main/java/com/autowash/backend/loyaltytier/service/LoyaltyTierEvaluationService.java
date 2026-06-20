package com.autowash.backend.loyaltytier.service;

import com.autowash.backend.customer.entity.Customer;
import com.autowash.backend.customer.repository.CustomerRepository;
import com.autowash.backend.loyaltytier.dto.CustomerTierEvaluationResponseDTO;
import com.autowash.backend.loyaltytier.entity.LoyaltyTier;
import com.autowash.backend.loyaltytier.repository.LoyaltyTierRepository;
import com.autowash.backend.loyaltytransaction.entity.LoyaltyTransaction;
import com.autowash.backend.loyaltytransaction.repository.LoyaltyTransactionRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Objects;

@RequiredArgsConstructor
@Service
public class LoyaltyTierEvaluationService {

    private final CustomerRepository customerRepository;
    private final LoyaltyTierRepository loyaltyTierRepository;
    private final LoyaltyTransactionRepository loyaltyTransactionRepository;

    @Transactional
    public CustomerTierEvaluationResponseDTO evaluateCustomerTier(Integer customerId){
        Customer customer = customerRepository.findByUserId(customerId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Customer khong ton tai, id=" + customerId
                ));

        Integer currentPoints = getCurrentPoints(customerId);
        Integer totalVisits = getTotalVisits(customer);
        BigDecimal totalSpending = getTotalSpending(customer);

        List<LoyaltyTier> activeTiers = loyaltyTierRepository.findByIsActiveTrueOrderByPriorityLevelDesc();

        if(activeTiers.isEmpty()) {
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

    ///=====================Helpper======================================

    @Transactional
    public List<CustomerTierEvaluationResponseDTO> evaluateAllCustomers() {
        return customerRepository.findAll()
                .stream()
                .map(customer -> evaluateCustomerTier(customer.getCustomerId()))
                .toList();
    }

    private LoyaltyTier findMatchedTier(List<LoyaltyTier> activeTier,
                                        Integer currentPoints,
                                        Integer totalVisits,
                                        BigDecimal totalSpending) {
        return activeTier.stream()
                .filter(tier -> currentPoints >= tier.getMinPoints())
                .filter(tier -> totalVisits >= tier.getMinVisits())
                .filter(tier -> totalSpending.compareTo(tier.getMinSpending()) >= 0)
                .findFirst()
                .orElse(activeTier.get(activeTier.size() - 1));
    }

    private Integer getCurrentPoints(Integer customerId) {
        return loyaltyTransactionRepository
                .findTopByCustomerIdOrderByCreatedAtDesc(customerId)
                .map(LoyaltyTransaction::getBalanceAfter)
                .orElse(0);
    }

    private Integer getTotalVisits(Customer customer) {
        if(customer.getTotalVisits() == null) {
            return 0;
        }
        return customer.getTotalVisits();
    }

    private BigDecimal getTotalSpending(Customer customer) {
        if(customer.getTotalSpending() == null) {
            return BigDecimal.ZERO;
        }
        return customer.getTotalSpending();
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
