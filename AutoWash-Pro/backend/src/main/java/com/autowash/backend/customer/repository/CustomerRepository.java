package com.autowash.backend.customer.repository;

import com.autowash.backend.customer.entity.Customer;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CustomerRepository
        extends JpaRepository<Customer, Integer> {

    // =========================================================
    // ACCOUNT CUSTOMER
    // =========================================================

    /**
     * Tìm Customer theo tài khoản đăng nhập.
     *
     * Dùng cho:
     * - Customer xem profile.
     * - Customer tạo booking.
     * - Kiểm tra quyền sở hữu booking.
     * - Loyalty và reward.
     */
    Optional<Customer> findByUser_Id(Integer userId);

    /**
     * Kiểm tra một Account đã được liên kết với Customer chưa.
     */
    boolean existsByUser_Id(Integer userId);

    /**
     * Lấy danh sách Customer thuộc một brand.
     *
     * Method này đang được LoyaltyTierEvaluationServiceImpl sử dụng
     * khi đánh giá và cập nhật hạng thành viên theo brand.
     */
    List<Customer> findByBrandId(Integer brandId);

    // =========================================================
    // GUEST CUSTOMER
    // =========================================================

    /**
     * Tìm hồ sơ Guest mới nhất theo số điện thoại.
     *
     * Chỉ lấy Customer không có Account để tránh lấy nhầm
     * Customer đã đăng ký tài khoản.
     */
    Optional<Customer>
    findFirstByUserIsNullAndPhoneOrderByCustomerIdDesc(String phone);

    /**
     * Tìm Guest bằng cả số điện thoại và tên.
     *
     * Method này an toàn hơn khi có nhiều người dùng chung
     * một số điện thoại.
     */
    Optional<Customer>
    findFirstByUserIsNullAndPhoneAndFullNameIgnoreCaseOrderByCustomerIdDesc(
            String phone,
            String fullName
    );

    /**
     * Tìm Guest mới nhất theo email.
     */
    Optional<Customer>
    findFirstByUserIsNullAndEmailIgnoreCaseOrderByCustomerIdDesc(
            String email
    );

    // =========================================================
    // SEARCH
    // =========================================================

    /**
     * Danh sách tất cả Customer có cùng số điện thoại.
     *
     * Không dùng Optional vì phone của Customer không đặt UNIQUE.
     */
    List<Customer> findByPhoneOrderByCustomerIdDesc(String phone);

    /**
     * Danh sách Customer theo email, không phân biệt hoa thường.
     */
    List<Customer> findByEmailIgnoreCaseOrderByCustomerIdDesc(
            String email
    );

    /**
     * Tìm gần đúng theo tên để Employee tra cứu khách tại quầy.
     */
    List<Customer> findTop20ByFullNameContainingIgnoreCaseOrderByCustomerIdDesc(
            String fullName
    );

    // =========================================================
    // PESSIMISTIC LOCK
    // =========================================================

    /**
     * Khóa Customer khi thực hiện thao tác thay đổi điểm,
     * tránh hai request đồng thời cùng cập nhật totalPoints.
     */
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