package com.autowash.backend.employee.repository;

import com.autowash.backend.employee.entity.Employee;
import com.autowash.backend.employee.entity.Employee.EmployeePosition;
import com.autowash.backend.employee.entity.Employee.StaffRole;
import com.autowash.backend.employee.entity.Employee.StaffStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Integer> {

    /**
     * Tìm hồ sơ Employee từ userId lấy trong JWT.
     */
    Optional<Employee> findByUser_Id(Integer userId);

    /**
     * Tìm Employee đang hoạt động theo tài khoản đăng nhập.
     */
    Optional<Employee> findByUser_IdAndStatus(
            Integer userId,
            StaffStatus status
    );

    /**
     * Lấy toàn bộ nhân viên theo chi nhánh và trạng thái.
     */
    List<Employee> findByBranch_BranchIdAndStatus(
            Integer branchId,
            StaffStatus status
    );

    /**
     * Lấy nhân viên theo chi nhánh, vai trò vận hành và trạng thái.
     */
    List<Employee> findByBranch_BranchIdAndRoleAndStatus(
            Integer branchId,
            StaffRole role,
            StaffStatus status
    );

    Optional<Employee> findByPhone(String phone);

    Optional<Employee> findByEmailIgnoreCase(String email);

    boolean existsByPhone(String phone);

    boolean existsByEmailIgnoreCase(String email);

    boolean existsByUser_Id(Integer userId);

    /**
     * Tìm nhân viên theo chức vụ và trạng thái hoạt động.
     * Dùng để thông báo cho toàn bộ admin đang active.
     */
    List<Employee> findByPositionAndStatus(
            EmployeePosition position,
            StaffStatus status
    );
}