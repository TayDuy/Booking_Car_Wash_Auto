// backend/src/main/java/com/autowash/backend/refund/mapper/RefundMapper.java
package com.autowash.backend.refund.mapper;

import com.autowash.backend.customer.entity.Customer;
import com.autowash.backend.employee.entity.Employee;
import com.autowash.backend.payment.entity.Payment;
import com.autowash.backend.refund.dto.RefundCreateRequestDTO;
import com.autowash.backend.refund.dto.RefundCustomerCreateRequestDTO;
import com.autowash.backend.refund.dto.RefundResponseDTO;
import com.autowash.backend.refund.dto.RefundSelfRequestDTO;
import com.autowash.backend.refund.entity.Refund;
import org.springframework.stereotype.Component;

@Component
public class RefundMapper {

    public Refund toEntity(RefundCreateRequestDTO dto, Payment payment, Employee requestedBy) {
        return Refund.builder()
                .payment(payment)
                .requestedBy(requestedBy)
                .amount(dto.getAmount())
                .reason(dto.getReason())
                .refundMethod(dto.getRefundMethod())
                .bankName(dto.getBankName())
                .bankAccountNumber(dto.getBankAccountNumber())
                .bankAccountName(dto.getBankAccountName())
                .build();
    }

    /** Khách hàng tự tạo yêu cầu — amount/refundMethod do service tự xác định trước khi gọi hàm này. */
    public Refund toSelfEntity(RefundSelfRequestDTO dto, Payment payment, Customer requestedByCustomer,
                               java.math.BigDecimal amount, Refund.RefundMethod refundMethod) {
        return Refund.builder()
                .payment(payment)
                .requestedByCustomer(requestedByCustomer)
                .amount(amount)
                .reason(dto.getReason())
                .refundMethod(refundMethod)
                .build();
    }

    /** Khách hàng tự tạo yêu cầu từ booking (có chọn phương thức hoàn tiền, bank info). */
    public Refund toCustomerEntity(RefundCustomerCreateRequestDTO dto, Payment payment, Customer requestedByCustomer,
                                   java.math.BigDecimal amount, Refund.RefundMethod refundMethod) {
        return Refund.builder()
                .payment(payment)
                .requestedByCustomer(requestedByCustomer)
                .amount(amount)
                .reason(dto.getReason())
                .refundMethod(refundMethod)
                .bankName(dto.getBankName())
                .bankAccountNumber(dto.getBankAccountNumber())
                .bankAccountName(dto.getBankAccountName())
                .build();
    }

    public RefundResponseDTO toResponse(Refund refund) {
        Payment payment = refund.getPayment();
        var booking = payment != null ? payment.getBooking() : null;
        var customer = booking != null ? booking.getCustomer() : null;
        Employee requestedBy = refund.getRequestedBy();
        Employee processedBy = refund.getProcessedBy();
        Employee completedBy = refund.getCompletedBy();

        return RefundResponseDTO.builder()
                .refundId(refund.getRefundId())
                .paymentId(payment != null ? payment.getPaymentId() : null)
                .bookingId(booking != null ? booking.getBookingId() : null)
                .bookingCode(booking != null ? booking.getBookingCode() : null)
                .customerName(customer != null ? customer.getFullName() : null)
                .customerPhone(customer != null ? customer.resolvePhone() : null)
                .originalFinalAmount(payment != null ? payment.getFinalAmount() : null)
                .amount(refund.getAmount())
                .reason(refund.getReason())
                .refundMethod(refund.getRefundMethod())
                .bankName(refund.getBankName())
                .bankAccountNumber(refund.getBankAccountNumber())
                .bankAccountName(refund.getBankAccountName())
                .status(refund.getStatus())
                .adminNote(refund.getAdminNote())
                .requestedById(requestedBy != null ? requestedBy.getEmployeeId() : null)
                .requestedByName(
                        requestedBy != null
                                ? requestedBy.getFullName()
                                : (refund.getRequestedByCustomer() != null
                                ? refund.getRequestedByCustomer().getFullName() + " (khách hàng tự yêu cầu)"
                                : null))
                .processedById(processedBy != null ? processedBy.getEmployeeId() : null)
                .processedByName(processedBy != null ? processedBy.getFullName() : null)
                .processedAt(refund.getProcessedAt())
                .completedById(completedBy != null ? completedBy.getEmployeeId() : null)
                .completedByName(completedBy != null ? completedBy.getFullName() : null)
                .completedAt(refund.getCompletedAt())
                .completionNote(refund.getCompletionNote())
                .createdAt(refund.getCreatedAt())
                .updatedAt(refund.getUpdatedAt())
                .build();
    }
}