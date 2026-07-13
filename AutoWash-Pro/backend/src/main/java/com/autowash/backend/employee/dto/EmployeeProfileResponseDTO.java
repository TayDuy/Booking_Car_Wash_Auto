package com.autowash.backend.employee.dto;

import com.autowash.backend.employee.entity.Employee.EmployeePosition;
import com.autowash.backend.employee.entity.Employee.StaffRole;
import com.autowash.backend.employee.entity.Employee.StaffStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Thông tin nhân viên đang đăng nhập.
 *
 * Dùng cho API:
 * GET /api/v1/staff/profile
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmployeeProfileResponseDTO {

    private Integer employeeId;

    // Tài khoản đăng nhập
    private Integer userId;
    private String username;
    private String accountEmail;

    // Thông tin nhân viên
    private String fullName;
    private String phone;
    private String email;

    private EmployeePosition position;
    private StaffRole role;
    private StaffStatus status;

    // Chi nhánh làm việc
    private Integer branchId;
    private String branchName;
    private String branchAddress;
    private String branchPhone;

    // Quyền nghiệp vụ
    private Boolean assignable;
    private Boolean canManageQueue;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}