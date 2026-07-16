package com.autowash.backend.booking.dto;

import com.autowash.backend.employee.entity.Employee.StaffRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AssignableStaffResponseDTO {

    private Integer employeeId;
    private String fullName;
    private String phone;
    private String email;

    private StaffRole role;

    private Integer branchId;
    private String branchName;
}