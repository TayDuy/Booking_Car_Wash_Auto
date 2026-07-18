package com.autowash.backend.customer.repository;

import com.autowash.backend.customer.entity.Customer;
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
    // ADMIN LIST (JOIN FETCH — tránh N+1)
    // =========================================================

    /**
     * Admin - danh sách toàn bộ customer kèm User (JOIN FETCH).
     *
     * Tránh N+1: nếu chỉ dùng findAll() rồi map sang DTO có đọc
     * customer.getUser().xxx(), vì User là @OneToOne(LAZY) nên Hibernate
     * sẽ bắn thêm 1 query SELECT riêng cho MỖI customer (N+1 query) khi
     * load trang "Quản lý khách hàng". Dùng JOIN FETCH gộp lại thành 1 query.
     */
    @Query("""
            SELECT c FROM Customer c
            LEFT JOIN FETCH c.user
            ORDER BY c.customerId DESC
            """)
    List<Customer> findAllWithUser();

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