package com.autowash.backend.customer.repository;

import com.autowash.backend.customer.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Integer> {
    Optional<Customer> findByUser_Id(Integer userId);
    List<Customer> findByBrandId(Integer brandId);

    Optional<Customer> findFirstByUserIsNullAndPhoneAndFullNameIgnoreCaseOrderByCustomerIdDesc(
            String phone, String fullName);

    /**
     * Tìm các customer thuộc một trong các tier chỉ định, và tài khoản đang active.
     * Dùng cho tính năng gửi thông báo hàng loạt theo hạng thành viên
     * (ví dụ: "Silver trở lên").
     */
    List<Customer> findByTierIdInAndUser_Status(List<Integer> tierIds, String status);
}