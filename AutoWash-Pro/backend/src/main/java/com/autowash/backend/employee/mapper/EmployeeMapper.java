package com.autowash.backend.employee.mapper;

import com.autowash.backend.booking.entity.Booking;
import com.autowash.backend.booking.entity.BookingDetail;
import com.autowash.backend.branch.entity.Branch;
import com.autowash.backend.customer.entity.Customer;
import com.autowash.backend.employee.dto.EmployeeProfileResponseDTO;
import com.autowash.backend.employee.dto.EmployeeQueueBookingResponseDTO;
import com.autowash.backend.employee.entity.Employee;
import com.autowash.backend.timeslot.entity.TimeSlot;
import com.autowash.backend.user.entity.User;
import com.autowash.backend.vehicle.entity.Vehicle;
import com.autowash.backend.washbay.entity.WashBay;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

/**
 * Chuyển đổi dữ liệu Employee và Booking sang DTO dành cho trang Employee.
 *
 * Mapper chỉ chịu trách nhiệm chuyển đổi dữ liệu:
 * - Không truy vấn repository.
 * - Không kiểm tra quyền.
 * - Không thay đổi trạng thái entity.
 */
@Component
public class EmployeeMapper {

    /**
     * Chuyển Employee đang đăng nhập thành DTO hồ sơ.
     */
    public EmployeeProfileResponseDTO toProfileResponse(Employee employee) {
        if (employee == null) {
            return null;
        }

        User user = employee.getUser();
        Branch branch = employee.getBranch();

        return EmployeeProfileResponseDTO.builder()
                .employeeId(employee.getEmployeeId())

                // Account
                .userId(user != null ? user.getId() : null)
                .username(user != null ? user.getUsername() : null)
                .accountEmail(user != null ? user.getEmail() : null)

                // Employee
                .fullName(employee.getFullName())
                .phone(employee.getPhone())
                .email(employee.getEmail())
                .position(employee.getPosition())
                .role(employee.getRole())
                .status(employee.getStatus())

                // Branch
                .branchId(branch != null ? branch.getBranchId() : null)
                .branchName(branch != null ? branch.getBranchName() : null)
                .branchAddress(branch != null ? branch.getAddress() : null)
                .branchPhone(branch != null ? branch.getPhone() : null)

                // Quyền nghiệp vụ
                .assignable(employee.isAssignable())
                .canManageQueue(employee.canManageQueue())

                // Audit
                .createdAt(employee.getCreatedAt())
                .updatedAt(employee.getUpdatedAt())
                .build();
    }

    /**
     * Chuyển một Booking thành DTO hàng chờ của Employee.
     */
    public EmployeeQueueBookingResponseDTO toQueueResponse(
            Booking booking,
            List<BookingDetail> details
    ) {
        if (booking == null) {
            return null;
        }

        List<BookingDetail> safeDetails =
                details != null ? details : Collections.emptyList();

        Customer customer = booking.getCustomer();
        Vehicle vehicle = booking.getVehicle();
        TimeSlot slot = booking.getSlot();
        Branch branch = booking.getBranch();
        Employee assignedEmployee = booking.getAssignedStaff();

        WashBay washBay = slot != null
                ? slot.getWashBay()
                : null;

        String customerPhone = resolveCustomerPhone(customer);

        return EmployeeQueueBookingResponseDTO.builder()
                // Booking
                .bookingId(booking.getBookingId())
                .bookingCode(booking.getBookingCode())
                .status(booking.getStatus())
                .priorityScore(booking.getPriorityScore())
                .bookingDate(booking.getBookingDate())
                .checkInAt(booking.getCheckInAt())
                .completedAt(booking.getCompleteAt())
                .waitingMinutes(calculateWaitingMinutes(booking))
                .note(booking.getNote())

                // Customer
                .customerId(
                        customer != null
                                ? customer.getCustomerId()
                                : null
                )
                .customerName(
                        customer != null
                                ? customer.getFullName()
                                : null
                )
                .customerPhoneMasked(maskPhone(customerPhone))

                // Vehicle
                .vehicleId(
                        vehicle != null
                                ? vehicle.getVehicleId()
                                : null
                )
                .licensePlate(
                        vehicle != null
                                ? vehicle.getLicensePlate()
                                : null
                )
                .vehicleType(
                        vehicle != null && vehicle.getVehicleType() != null
                                ? vehicle.getVehicleType().name()
                                : null
                )

                // Services
                .serviceNames(resolveServiceNames(safeDetails))
                .totalAmount(calculateTotalAmount(safeDetails))

                // Slot
                .slotId(
                        slot != null
                                ? slot.getSlotId()
                                : null
                )
                .slotDate(
                        slot != null
                                ? slot.getSlotDate()
                                : null
                )
                .slotStartTime(
                        slot != null
                                ? slot.getStartTime()
                                : null
                )
                .slotEndTime(
                        slot != null
                                ? slot.getEndTime()
                                : null
                )

                // Branch
                .branchId(
                        branch != null
                                ? branch.getBranchId()
                                : null
                )
                .branchName(
                        branch != null
                                ? branch.getBranchName()
                                : null
                )

                // Wash bay
                .bayId(
                        washBay != null
                                ? washBay.getBayId()
                                : null
                )
                .bayName(
                        washBay != null
                                ? washBay.getBayName()
                                : null
                )
                .bayStatus(
                        washBay != null
                                ? washBay.getStatus()
                                : null
                )

                // Assigned Employee
                .assignedEmployeeId(
                        assignedEmployee != null
                                ? assignedEmployee.getEmployeeId()
                                : null
                )
                .assignedEmployeeName(
                        assignedEmployee != null
                                ? assignedEmployee.getFullName()
                                : null
                )
                .build();
    }

    /**
     * Lấy số điện thoại liên hệ của Customer.
     *
     * Thứ tự ưu tiên:
     * 1. Customer.phone — dùng cho khách vãng lai và dữ liệu đã đồng bộ.
     * 2. User.phone — fallback cho Customer có tài khoản cũ.
     */
    private String resolveCustomerPhone(Customer customer) {
        if (customer == null) {
            return null;
        }

        return customer.resolvePhone();
    }

    /**
     * Lấy danh sách tên dịch vụ, loại bỏ null và trùng lặp.
     */
    private List<String> resolveServiceNames(
            List<BookingDetail> details
    ) {
        return details.stream()
                .filter(detail -> detail != null)
                .filter(detail -> detail.getService() != null)
                .map(detail -> detail.getService().getServiceName())
                .filter(name -> name != null && !name.isBlank())
                .distinct()
                .toList();
    }

    /**
     * Tính tổng tiền từ snapshot subTotal của BookingDetail.
     */
    private BigDecimal calculateTotalAmount(
            List<BookingDetail> details
    ) {
        return details.stream()
                .filter(detail -> detail != null)
                .map(BookingDetail::getSubTotal)
                .filter(amount -> amount != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    /**
     * Tính số phút từ lúc check-in.
     *
     * Booking đã hoàn thành:
     * checkInAt → completeAt.
     *
     * Booking chưa hoàn thành:
     * checkInAt → hiện tại.
     */
    private long calculateWaitingMinutes(Booking booking) {
        if (booking.getCheckInAt() == null) {
            return 0L;
        }

        LocalDateTime endTime = booking.getCompleteAt() != null
                ? booking.getCompleteAt()
                : LocalDateTime.now();

        long minutes = Duration.between(
                booking.getCheckInAt(),
                endTime
        ).toMinutes();

        return Math.max(minutes, 0L);
    }

    /**
     * Che số điện thoại trên danh sách hàng chờ.
     *
     * Ví dụ:
     * 0912345678 → 091****678
     */
    private String maskPhone(String phone) {
        if (phone == null || phone.isBlank()) {
            return null;
        }

        String normalized = phone.trim();

        if (normalized.length() >= 7) {
            String firstPart = normalized.substring(0, 3);
            String lastPart = normalized.substring(
                    normalized.length() - 3
            );

            int hiddenLength = normalized.length() - 6;

            return firstPart
                    + "*".repeat(hiddenLength)
                    + lastPart;
        }

        if (normalized.length() <= 2) {
            return "*".repeat(normalized.length());
        }

        return normalized.charAt(0)
                + "*".repeat(normalized.length() - 2)
                + normalized.charAt(normalized.length() - 1);
    }
}