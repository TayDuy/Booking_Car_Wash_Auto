package com.autowash.backend.employee.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

/**
 * Request để Employee tạo booking hộ khách hàng.
 *
 * Có hai trường hợp:
 *
 * 1. Khách đã có tài khoản:
 *    - Truyền customerId.
 *    - Không cần truyền guestName, guestPhone, guestEmail.
 *
 * 2. Khách vãng lai:
 *    - customerId để null.
 *    - Bắt buộc guestName, guestPhone và initialPassword.
 *    - Backend tạo User và Customer trong cùng transaction với booking.
 *
 * branchId không được nhận từ frontend.
 * Backend tự lấy branch từ Employee đang đăng nhập.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmployeeBookingCreateRequestDTO {

    // =========================================================
    // CUSTOMER
    // =========================================================

    /**
     * ID khách hàng đã tồn tại.
     *
     * Để null nếu là khách vãng lai.
     */
    private Integer customerId;

    /**
     * Tên khách vãng lai.
     */
    @Size(
            max = 100,
            message = "Tên khách hàng tối đa 100 ký tự"
    )
    private String guestName;

    /**
     * Số điện thoại khách vãng lai.
     */
    @Pattern(
            regexp = "^(0|\\+84)[0-9]{9,10}$",
            message = "Số điện thoại khách hàng không hợp lệ"
    )
    private String guestPhone;

    /**
     * Email khách vãng lai, không bắt buộc.
     */
    @Email(message = "Email khách hàng không hợp lệ")
    @Size(
            max = 100,
            message = "Email khách hàng tối đa 100 ký tự"
    )
    private String guestEmail;

    /**
     * Mật khẩu ban đầu cho tài khoản khách vãng lai.
     *
     * Chỉ bắt buộc khi customerId để null. Service sẽ kiểm tra điều kiện
     * này và mã hóa mật khẩu trước khi lưu User.
     */
    @Size(
            min = 6,
            max = 72,
            message = "Mật khẩu ban đầu phải từ 6 đến 72 ký tự"
    )
    private String initialPassword;

    // =========================================================
    // VEHICLE
    // =========================================================

    @NotBlank(message = "Biển số xe không được để trống")
    @Size(
            max = 20,
            message = "Biển số xe tối đa 20 ký tự"
    )
    private String licensePlate;

    @NotBlank(message = "Hãng xe không được để trống")
    @Size(
            max = 50,
            message = "Hãng xe tối đa 50 ký tự"
    )
    private String brand;

    @Size(
            max = 50,
            message = "Mẫu xe tối đa 50 ký tự"
    )
    private String model;

    /**
     * Giá trị phải khớp Vehicle.VehicleType.
     *
     * Việc parse và báo lỗi cụ thể sẽ được xử lý trong service.
     */
    @NotBlank(message = "Loại xe không được để trống")
    private String vehicleType;

    // =========================================================
    // SLOT
    // =========================================================

    /**
     * Slot bắt buộc phải thuộc chi nhánh của Employee.
     */
    @NotNull(message = "Khung giờ không được để trống")
    private Integer slotId;

    // =========================================================
    // SERVICES
    // =========================================================

    @Valid
    @NotEmpty(message = "Booking phải có ít nhất một dịch vụ")
    private List<ServiceItem> details;

    // =========================================================
    // NOTE
    // =========================================================

    @Size(
            max = 255,
            message = "Ghi chú tối đa 255 ký tự"
    )
    private String note;

    // =========================================================
    // HELPERS
    // =========================================================

    /**
     * Khách hàng đã tồn tại trong hệ thống.
     */
    public boolean hasExistingCustomer() {
        return customerId != null;
    }

    /**
     * Request đang sử dụng thông tin khách vãng lai.
     */
    public boolean hasGuestInformation() {
        return guestName != null
                && !guestName.isBlank()
                && guestPhone != null
                && !guestPhone.isBlank();
    }

    /**
     * Khách vãng lai có đủ dữ liệu tối thiểu để tạo tài khoản đăng nhập.
     */
    public boolean hasCompleteAccountInformation() {
        return hasGuestInformation()
                && initialPassword != null
                && !initialPassword.isBlank();
    }

    // =========================================================
    // SERVICE ITEM
    // =========================================================

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ServiceItem {

        @NotNull(message = "Dịch vụ không được để trống")
        private Integer serviceId;

        @NotNull(message = "Số lượng dịch vụ không được để trống")
        @Min(
                value = 1,
                message = "Số lượng dịch vụ tối thiểu là 1"
        )
        private Integer quantity;
    }
}