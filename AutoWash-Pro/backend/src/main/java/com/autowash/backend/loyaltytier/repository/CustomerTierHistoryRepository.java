package com.autowash.backend.loyaltytier.repository;

import com.autowash.backend.loyaltytier.entity.CustomerTierHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CustomerTierHistoryRepository extends JpaRepository<CustomerTierHistory, Integer> {

    List<CustomerTierHistory> findByCustomer_CustomerIdOrderByChangedAtDesc(Integer customerId);
}
