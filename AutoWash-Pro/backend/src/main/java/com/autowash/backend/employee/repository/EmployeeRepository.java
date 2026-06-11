package com.autowash.backend.employee.repository;

import com.autowash.backend.employee.entity.Employee;
import com.autowash.backend.employee.entity.Employee.StaffStatus;
import com.autowash.backend.employee.entity.Employee.StaffRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Integer> {

    List<Employee> findByBranch_BranchIdAndStatus(Integer branchId, StaffStatus status);

    List<Employee> findByBranch_BranchIdAndRoleAndStatus(Integer branchId, StaffRole role, StaffStatus status);

    Optional<Employee> findByPhone(String phone);

    Optional<Employee> findByEmail(String email);

    boolean existsByPhone(String phone);

    boolean existsByEmail(String email);
}