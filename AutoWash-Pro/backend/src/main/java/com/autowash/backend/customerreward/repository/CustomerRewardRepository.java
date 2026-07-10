package com.autowash.backend.customerreward.repository;

import com.autowash.backend.customerreward.entity.CustomerReward;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CustomerRewardRepository extends JpaRepository<CustomerReward, Integer> {

    List<CustomerReward> findByCustomer_CustomerIdOrderByRedeemedAtDesc(Integer customerId);

    Optional<CustomerReward> findByVoucherCode(String voucherCode);

    List<CustomerReward> findByCustomer_CustomerIdAndStatusOrderByRedeemedAtDesc(
            Integer customerId,
            String status
    );
}
