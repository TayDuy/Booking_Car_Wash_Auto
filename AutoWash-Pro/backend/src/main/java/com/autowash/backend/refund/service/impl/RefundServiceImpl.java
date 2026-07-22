// backend/src/main/java/com/autowash/backend/refund/service/impl/RefundServiceImpl.java
package com.autowash.backend.refund.service.impl;

import com.autowash.backend.booking.entity.Booking;
import com.autowash.backend.booking.enums.BookingStatus;
import com.autowash.backend.booking.repository.BookingRepository;
import com.autowash.backend.common.exception.BusinessException;
import com.autowash.backend.common.exception.ResourceNotFoundException;
import com.autowash.backend.customer.entity.Customer;
import com.autowash.backend.customer.repository.CustomerRepository;
import com.autowash.backend.employee.entity.Employee;
import com.autowash.backend.employee.entity.Employee.EmployeePosition;
import com.autowash.backend.employee.entity.Employee.StaffStatus;
import com.autowash.backend.employee.repository.EmployeeRepository;
import com.autowash.backend.user.entity.User;
import com.autowash.backend.user.repository.UserRepository;
import com.autowash.backend.notification.dto.NotificationCreateDTO;
import com.autowash.backend.notification.entity.Notification;
import com.autowash.backend.notification.service.NotificationService;
import com.autowash.backend.payment.entity.Payment;
import com.autowash.backend.payment.entity.Payment.PaymentStatus;
import com.autowash.backend.payment.repository.PaymentRepository;
import com.autowash.backend.refund.dto.*;
import com.autowash.backend.refund.entity.Refund;
import com.autowash.backend.refund.entity.Refund.RefundStatus;
import com.autowash.backend.refund.mapper.RefundMapper;
import com.autowash.backend.refund.repository.RefundRepository;
import com.autowash.backend.refund.service.RefundService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class RefundServiceImpl implements RefundService {

    private final RefundRepository refundRepository;
    private final PaymentRepository paymentRepository;
    private final BookingRepository bookingRepository;
    private final EmployeeRepository employeeRepository;
    private final CustomerRepository customerRepository;
    private final UserRepository userRepository;
    private final RefundMapper refundMapper;
    private final com.autowash.backend.notification.service.NotificationHelperService notificationHelperService;

    @Override
    @Transactional(readOnly = true)
    public RefundLookupResponseDTO lookupByBookingCode(String bookingCode) {
        Payment payment = paymentRepository.findAll().stream()
                .filter(p -> p.getBooking() != null
                        && bookingCode.equalsIgnoreCase(p.getBooking().getBookingCode()))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Payment", "bookingCode", bookingCode));

        Booking booking = payment.getBooking();
        Customer customer = booking.getCustomer();

        boolean eligible = true;
        String ineligibleReason = null;

        if (payment.getPaymentStatus() != PaymentStatus.paid) {
            eligible = false;
            ineligibleReason = "Giao dịch chưa thanh toán hoặc đã ở trạng thái khác 'paid', không thể hoàn tiền.";
        } else if (booking.getStatus() == BookingStatus.completed) {
            eligible = false;
            ineligibleReason = "Đơn đặt lịch đã hoàn thành dịch vụ (completed), không thể gửi yêu cầu hoàn tiền.";
        } else if (refundRepository.findOpenRefundByPaymentId(payment.getPaymentId()).isPresent()) {
            eligible = false;
            ineligibleReason = "Giao dịch này đã có yêu cầu hoàn tiền đang xử lý.";
        }

        return RefundLookupResponseDTO.builder()
                .paymentId(payment.getPaymentId())
                .bookingId(booking.getBookingId())
                .bookingCode(booking.getBookingCode())
                .customerName(customer != null ? customer.getFullName() : null)
                .customerPhone(customer != null ? customer.resolvePhone() : null)
                .finalAmount(payment.getFinalAmount())
                .paymentStatus(payment.getPaymentStatus().name())
                .eligible(eligible)
                .ineligibleReason(ineligibleReason)
                .build();
    }

    @Override
    public RefundResponseDTO create(RefundCreateRequestDTO request, Integer requestingUserId) {
        Employee requestedBy = resolveEmployee(requestingUserId);

        Payment payment = paymentRepository.findByIdForUpdate(request.getPaymentId())
                .orElseThrow(() -> new ResourceNotFoundException("Payment", "id", request.getPaymentId()));

        if (payment.getPaymentStatus() != PaymentStatus.paid) {
            throw new BusinessException(
                    "Chỉ có thể tạo yêu cầu hoàn tiền cho giao dịch đã thanh toán (paid).",
                    HttpStatus.BAD_REQUEST);
        }

        Booking booking = payment.getBooking();
        if (booking != null && booking.getStatus() == BookingStatus.completed) {
            throw new BusinessException(
                    "Đơn đặt lịch đã hoàn thành dịch vụ. Không thể tạo yêu cầu hoàn tiền cho đơn đã hoàn thành.",
                    HttpStatus.BAD_REQUEST);
        }

        refundRepository.findOpenRefundByPaymentId(payment.getPaymentId()).ifPresent(existing -> {
            throw new BusinessException(
                    "Giao dịch này đã có yêu cầu hoàn tiền đang chờ xử lý (mã #" + existing.getRefundId() + ").",
                    HttpStatus.CONFLICT);
        });

        if (request.getAmount().compareTo(payment.getFinalAmount()) > 0) {
            throw new BusinessException(
                    "Số tiền hoàn không được vượt quá số tiền đã thanh toán ("
                            + payment.getFinalAmount().toPlainString() + " VND).",
                    HttpStatus.BAD_REQUEST);
        }

        if (request.getRefundMethod() == Refund.RefundMethod.bank_transfer) {
            if (isBlank(request.getBankName())
                    || isBlank(request.getBankAccountNumber())
                    || isBlank(request.getBankAccountName())) {
                throw new BusinessException(
                        "Vui lòng nhập đầy đủ thông tin ngân hàng khi hoàn tiền qua chuyển khoản.",
                        HttpStatus.BAD_REQUEST);
            }
        }

        Refund refund = refundMapper.toEntity(request, payment, requestedBy);
        refund.setStatus(RefundStatus.pending);
        refund = refundRepository.save(refund);

        notifyAdminsRefundRequested(refund);

        return refundMapper.toResponse(refund);
    }

    @Override
    @Transactional(readOnly = true)
    public List<RefundResponseDTO> getMyCustomerRefunds(Integer customerUserId) {
        Customer customer = resolveCustomer(customerUserId);

        return refundRepository
                .findByRequestedByCustomer_CustomerIdOrderByCreatedAtDesc(customer.getCustomerId())
                .stream()
                .map(refundMapper::toResponse)
                .toList();
    }

    /**
     * Khách hàng tự bấm "Yêu cầu hoàn tiền" trên app/web — popup xác nhận chỉ cần nhập lý do.
     * Áp dụng như nhau cho cả thanh toán online (VNPAY/PayPal → hoàn tự động qua cổng khi admin
     * duyệt) và thanh toán tại quầy (cash/pos → nhân viên chuyển tiền thủ công sau khi duyệt).
     * Điều kiện DUY NHẤT: payment đang ở trạng thái "paid" — KHÔNG giới hạn theo trạng thái
     * booking (khách có thể yêu cầu hoàn tiền bất kỳ lúc nào miễn là đã thanh toán).
     */
    @Override
    public RefundResponseDTO createSelfRequest(RefundCustomerCreateRequestDTO request, Integer customerUserId) {
        Customer customer = resolveCustomer(customerUserId);

        Booking booking = bookingRepository.findById(request.getBookingId())
                .orElseThrow(() -> new ResourceNotFoundException("Booking", "id", request.getBookingId()));

        if (booking.getCustomer() == null
                || !booking.getCustomer().getCustomerId().equals(customer.getCustomerId())) {
            throw new BusinessException(
                    "Bạn không có quyền yêu cầu hoàn tiền cho đơn đặt lịch này.",
                    HttpStatus.FORBIDDEN);
        }

        Payment payment = booking.getPayment();
        if (payment == null) {
            throw new BusinessException(
                    "Đơn đặt lịch này chưa có giao dịch thanh toán.",
                    HttpStatus.BAD_REQUEST);
        }

        if (payment.getPaymentStatus() != PaymentStatus.paid) {
            throw new BusinessException(
                    "Chỉ có thể yêu cầu hoàn tiền cho giao dịch đã thanh toán (paid).",
                    HttpStatus.BAD_REQUEST);
        }

        if (booking.getStatus() == BookingStatus.completed) {
            throw new BusinessException(
                    "Đơn đặt lịch đã hoàn thành dịch vụ. Không thể gửi yêu cầu hoàn tiền cho đơn đã hoàn thành.",
                    HttpStatus.BAD_REQUEST);
        }

        refundRepository.findOpenRefundByPaymentId(payment.getPaymentId()).ifPresent(existing -> {
            throw new BusinessException(
                    "Giao dịch này đã có yêu cầu hoàn tiền đang chờ xử lý (mã #" + existing.getRefundId() + ").",
                    HttpStatus.CONFLICT);
        });

        Refund.RefundMethod refundMethod = request.getRefundMethod();
        if (refundMethod == null) {
            refundMethod = Refund.RefundMethod.cash;
        }

        Refund refund = refundMapper.toCustomerEntity(request, payment, customer, payment.getFinalAmount(), refundMethod);
        refund.setStatus(RefundStatus.pending);
        refund = refundRepository.save(refund);

        notifyAdminsRefundRequested(refund);

        return refundMapper.toResponse(refund);
    }

    @Override
    @Transactional(readOnly = true)
    public RefundResponseDTO getById(Integer refundId) {
        return refundMapper.toResponse(getRefundOrThrow(refundId));
    }

    @Override
    @Transactional(readOnly = true)
    public List<RefundResponseDTO> getAll(RefundStatus status) {
        List<Refund> refunds = status != null
                ? refundRepository.findByStatusOrderByCreatedAtDesc(status)
                : refundRepository.findAllByOrderByCreatedAtDesc();

        return refunds.stream().map(refundMapper::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<RefundResponseDTO> getMine(Integer requestingUserId) {
        Employee employee = resolveEmployee(requestingUserId);
        if (employee == null) return List.of();

        return refundRepository.findByRequestedBy_EmployeeIdOrderByCreatedAtDesc(employee.getEmployeeId())
                .stream()
                .map(refundMapper::toResponse)
                .toList();
    }

    @Override
    public RefundResponseDTO markProcessing(Integer refundId, Integer adminUserId) {
        Employee admin = resolveEmployee(adminUserId);
        Refund refund = getRefundOrThrow(refundId);

        if (!refund.canMarkProcessing()) {
            throw new BusinessException(
                    "Chỉ có thể chuyển sang trạng thái đang xử lý từ trạng thái chờ (pending).",
                    HttpStatus.BAD_REQUEST);
        }

        refund.setStatus(RefundStatus.processing);
        refund.setProcessedBy(admin);
        refund = refundRepository.save(refund);

        notifyRequester(refund, "Yêu cầu hoàn tiền đang được xử lý",
                String.format("Yêu cầu hoàn tiền #%d cho giao dịch PAY-%d đang được admin xác minh.",
                        refund.getRefundId(), refund.getPayment().getPaymentId()),
                Notification.NotificationType.REFUND_PROCESSING);

        return refundMapper.toResponse(refund);
    }

    @Override
    public RefundResponseDTO approve(Integer refundId, RefundDecisionDTO decision, Integer adminUserId) {
        Employee admin = resolveEmployee(adminUserId);
        Refund refund = getRefundOrThrow(refundId);

        if (!refund.canDecide()) {
            throw new BusinessException(
                    "Yêu cầu hoàn tiền này đã được xử lý trước đó, không thể duyệt lại.",
                    HttpStatus.BAD_REQUEST);
        }

        final Integer refundPaymentId = refund.getPayment().getPaymentId();
        Payment payment = paymentRepository.findByIdForUpdate(refundPaymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment", "id", refundPaymentId));

        if (payment.getPaymentStatus() != PaymentStatus.paid) {
            throw new BusinessException(
                    "Giao dịch không còn ở trạng thái 'paid', không thể duyệt hoàn tiền.",
                    HttpStatus.CONFLICT);
        }

        String adminNote = decision != null ? decision.getAdminNote() : null;
        refund.approve(admin, adminNote);
        refund = refundRepository.save(refund);

        Booking booking = payment.getBooking();
        if (booking != null) {
            booking.setStatus(BookingStatus.cancelled);
            bookingRepository.save(booking);
        }

        String refundMethodStr = refund.getRefundMethod() != null ? refund.getRefundMethod().name() : "tiền";

        notifyRequester(refund, "Yêu cầu hoàn tiền đã được duyệt",
                String.format("Yêu cầu hoàn tiền #%d đã được duyệt, vui lòng thực hiện chuyển tiền (%s) và xác nhận hoàn tất.",
                        refund.getRefundId(), refundMethodStr),
                Notification.NotificationType.REFUND_APPROVED);

        notifyCustomer(refund, "Hoàn tiền — lịch hẹn đã hủy",
                String.format("Yêu cầu hoàn tiền %s VND cho lịch #%s đã được duyệt. Lịch hẹn đã được hủy.",
                        refund.getAmount() != null ? refund.getAmount().toPlainString() : "0",
                        booking != null ? booking.getBookingCode() : ""),
                Notification.NotificationType.REFUND_APPROVED);

        return refundMapper.toResponse(refund);
    }

    @Override
    public RefundResponseDTO complete(Integer refundId, RefundCompleteRequestDTO request, Integer staffUserId) {
        Employee staff = resolveEmployee(staffUserId);
        Refund refund = getRefundOrThrow(refundId);

        if (!refund.canComplete()) {
            throw new BusinessException(
                    "Chỉ có thể xác nhận hoàn tất với yêu cầu đã được duyệt (approved) và hoàn tiền thủ công "
                            + "(cash/bank_transfer). Yêu cầu hoàn về phương thức thanh toán gốc đã được tự động hoàn tất khi duyệt.",
                    HttpStatus.BAD_REQUEST);
        }

        final Integer refundPaymentId = refund.getPayment().getPaymentId();
        Payment payment = paymentRepository.findByIdForUpdate(refundPaymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment", "id", refundPaymentId));

        String completionNote = request != null ? request.getCompletionNote() : null;
        refund.complete(staff, completionNote);
        refund = refundRepository.save(refund);

        payment.setPaymentStatus(PaymentStatus.refunded);
        paymentRepository.save(payment);

        notifyRequester(refund, "Yêu cầu hoàn tiền đã hoàn tất",
                String.format("Yêu cầu hoàn tiền #%d (%s VND) đã được chuyển tiền và đánh dấu hoàn tất.",
                        refund.getRefundId(), refund.getAmount() != null ? refund.getAmount().toPlainString() : "0"),
                Notification.NotificationType.REFUND_COMPLETED);

        notifyCustomer(refund, "Hoàn tiền thành công",
                String.format("Yêu cầu hoàn tiền %s VND cho lịch #%s đã hoàn tất.",
                        refund.getAmount() != null ? refund.getAmount().toPlainString() : "0",
                        payment.getBooking() != null ? payment.getBooking().getBookingCode() : ""),
                Notification.NotificationType.REFUND_COMPLETED);

        return refundMapper.toResponse(refund);
    }

    @Override
    public RefundResponseDTO reject(Integer refundId, RefundDecisionDTO decision, Integer adminUserId) {
        Employee admin = resolveEmployee(adminUserId);
        Refund refund = getRefundOrThrow(refundId);

        if (!refund.canDecide()) {
            throw new BusinessException(
                    "Yêu cầu hoàn tiền này đã được xử lý trước đó, không thể từ chối lại.",
                    HttpStatus.BAD_REQUEST);
        }

        String adminNote = decision != null ? decision.getAdminNote() : null;
        refund.reject(admin, adminNote);
        refund = refundRepository.save(refund);

        notifyRequester(refund, "Yêu cầu hoàn tiền đã bị từ chối",
                String.format("Yêu cầu hoàn tiền #%d đã bị từ chối. Lý do: %s",
                        refund.getRefundId(), adminNote == null || adminNote.isBlank() ? "Không có" : adminNote),
                Notification.NotificationType.REFUND_REJECTED);

        return refundMapper.toResponse(refund);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private Refund getRefundOrThrow(Integer refundId) {
        return refundRepository.findById(refundId)
                .orElseThrow(() -> new ResourceNotFoundException("Refund", "id", refundId));
    }

    private Employee resolveEmployee(Integer userId) {
        if (userId == null) return null;
        return employeeRepository.findByUser_Id(userId).orElse(null);
    }

    private Customer resolveCustomer(Integer userId) {
        return customerRepository.findByUser_Id(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer", "userId", userId));
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private void notifyRequester(Refund refund, String title, String body, Notification.NotificationType type) {
        Payment payment = refund.getPayment();
        Booking booking = payment != null ? payment.getBooking() : null;
        Integer refId = booking != null ? booking.getBookingId() : refund.getRefundId();

        Employee requestedBy = refund.getRequestedBy();
        if (requestedBy != null && requestedBy.getUser() != null) {
            notificationHelperService.sendNotificationSafely(requestedBy.getUser().getId(), type, title, body, refId, "booking");
        } else if (refund.getRequestedByCustomer() != null && refund.getRequestedByCustomer().getUser() != null) {
            notificationHelperService.sendNotificationSafely(refund.getRequestedByCustomer().getUser().getId(), type, title, body, refId, "booking");
        }
    }

    private void notifyCustomer(Refund refund, String title, String body, Notification.NotificationType type) {
        Payment payment = refund.getPayment();
        Booking booking = payment != null ? payment.getBooking() : null;
        Customer customer = booking != null ? booking.getCustomer() : null;

        if (customer != null && customer.getUser() != null) {
            notificationHelperService.sendNotificationSafely(customer.getUser().getId(), type, title, body, booking != null ? booking.getBookingId() : null, "booking");
        }
    }

    private void notifyAdminsRefundRequested(Refund refund) {
        List<Employee> admins = employeeRepository.findByPositionAndStatus(EmployeePosition.admin, StaffStatus.active);
        Payment payment = refund.getPayment();
        Booking booking = payment != null ? payment.getBooking() : null;
        Integer refId = booking != null ? booking.getBookingId() : refund.getRefundId();

        for (Employee admin : admins) {
            if (admin.getUser() == null || admin.getUser().getId() == null) {
                continue;
            }
            String requesterName = refund.getRequestedBy() != null
                    ? "Nhân viên " + refund.getRequestedBy().getFullName()
                    : (refund.getRequestedByCustomer() != null
                    ? "Khách hàng " + refund.getRequestedByCustomer().getFullName()
                    : "Một người dùng");
            String body = String.format("%s vừa tạo yêu cầu hoàn tiền #%d (%s VND) cho PAY-%d.",
                    requesterName, refund.getRefundId(), refund.getAmount() != null ? refund.getAmount().toPlainString() : "0", refund.getPayment().getPaymentId());
            notificationHelperService.sendNotificationSafely(admin.getUser().getId(), Notification.NotificationType.REFUND_REQUESTED, "Yêu cầu hoàn tiền mới", body, refId, "booking");
        }
    }
}