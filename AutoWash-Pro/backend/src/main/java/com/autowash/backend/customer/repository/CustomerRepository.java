package com.autowash.backend.customer.repository;

import com.autowash.backend.customer.model.Customer;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CustomerRepository
        extends JpaRepository<Customer, Integer> {

    // =========================================================
    // ACCOUNT CUSTOMER
    // =========================================================

    Optional<Customer> findByUser_Id(Integer userId);

    boolean existsByUser_Id(Integer userId);

    List<Customer> findByBrandId(Integer brandId);

    /**
     * Tìm các customer thuộc một trong các tier chỉ định, và tài khoản đang active.
     * Dùng cho tính năng gửi thông báo hàng loạt theo hạng thành viên
     * (ví dụ: "Silver trở lên").
     */
    List<Customer> findByTierIdInAndUser_Status(List<Integer> tierIds, String status);

    // =========================================================
    // GUEST CUSTOMER
    // =========================================================

    Optional<Customer>
    findFirstByUserIsNullAndPhoneOrderByCustomerIdDesc(String phone);

    Optional<Customer>
    findFirstByUserIsNullAndPhoneAndFullNameIgnoreCaseOrderByCustomerIdDesc(
            String phone,
            String fullName
    );

    Optional<Customer>
    findFirstByUserIsNullAndEmailIgnoreCaseOrderByCustomerIdDesc(
            String email
    );

    // =========================================================
    // SEARCH
    // =========================================================

    List<Customer> findByPhoneOrderByCustomerIdDesc(String phone);

    List<Customer> findByEmailIgnoreCaseOrderByCustomerIdDesc(
            String email
    );

    List<Customer> findTop20ByFullNameContainingIgnoreCaseOrderByCustomerIdDesc(
            String fullName
    );

    // =========================================================
    // PESSIMISTIC LOCK
    // =========================================================

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT c
            FROM Customer c
            WHERE c.customerId = :customerId
            """)
    Optional<Customer> findByIdForUpdate(
            @Param("customerId") Integer customerId
    );
}
