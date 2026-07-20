// backend/src/main/java/com/autowash/backend/refund/repository/RefundRepository.java
package com.autowash.backend.refund.repository;

import com.autowash.backend.refund.entity.Refund;
import com.autowash.backend.refund.entity.Refund.RefundStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RefundRepository extends JpaRepository<Refund, Integer> {

    List<Refund> findByStatusOrderByCreatedAtDesc(RefundStatus status);

    List<Refund> findAllByOrderByCreatedAtDesc();

    List<Refund> findByRequestedBy_EmployeeIdOrderByCreatedAtDesc(Integer employeeId);

    List<Refund> findByRequestedByCustomer_CustomerIdOrderByCreatedAtDesc(Integer customerId);

    @Query("""
            SELECT r FROM Refund r
            WHERE r.payment.paymentId = :paymentId
              AND r.status IN ('pending', 'processing', 'approved')
            """)
    Optional<Refund> findOpenRefundByPaymentId(@Param("paymentId") Integer paymentId);

    List<Refund> findByPayment_PaymentId(Integer paymentId);
}