package com.autowash.backend.customer.repository;

import com.autowash.backend.customer.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Integer> {
    Optional<Customer> findByUserId(Integer userId);
    List<Customer> findByBrandId(Integer brandId);
}