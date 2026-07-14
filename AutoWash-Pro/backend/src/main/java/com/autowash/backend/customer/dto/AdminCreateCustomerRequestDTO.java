package com.autowash.backend.customer.dto;

import jakarta.validation.constraints.*;
import lombok.*;

import java.time.LocalDate;

/**
 * DTO dùng khi STAFF/ADMIN tạo tài khoản khách hàng hộ (walk-in customer, khách gọi điện, v.v).
 * Tạo đồng thời cả User (account đăng nhập) và Customer (hồ sơ khách hàng).
 *
 * Khác với luồng tự đăng ký (RegisterRequestDTO):
 * - Không bắt buộc xác minh OTP số điện thoại (nhân viên đã xác minh trực tiếp).
 * - Nếu không truyền password, hệ thống sẽ tự sinh mật khẩu ngẫu nhiên
 *   (khách có thể đổi lại sau, hoặc dùng chức năng quên mật khẩu).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminCreateCustomerRequestDTO {

    @NotBlank(message = "Username không được để trống")
    @Size(min = 3, max = 50, message = "Username phải từ 3-50 ký tự")
    private String username;

    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không hợp lệ")
    private String email;

    /** Nếu để trống, backend sẽ tự sinh mật khẩu ngẫu nhiên. */
    @Size(min = 6, message = "Password tối thiểu 6 ký tự")
    private String password;

    @NotBlank(message = "Số điện thoại không được để trống")
    @Pattern(regexp = "^0(3[2-9]|5[25689]|7[06-9]|8[1-9]|9[0-9])[0-9]{7}$",
            message = "Số điện thoại không đúng định dạng (VD: 0912345678)")
    private String phone;

    @NotBlank(message = "Họ tên không được để trống")
    @Size(max = 100)
    private String fullName;

    private LocalDate dateOfBirth;

    private String gender;
}