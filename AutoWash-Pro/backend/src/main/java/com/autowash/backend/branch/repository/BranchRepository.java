package com.autowash.backend.branch.repository;

import com.autowash.backend.branch.entity.Branch;
import com.autowash.backend.branch.entity.Branch.BranchStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BranchRepository extends JpaRepository<Branch, Integer> {

    List<Branch> findByStatus(BranchStatus status);

    Optional<Branch> findByPhone(String phone);

    boolean existsByBranchName(String branchName);

    boolean existsByPhone(String phone);

    // Thêm vào BranchRepository – dùng khi UPDATE để loại trừ chính mình
    boolean existsByBranchNameAndBranchIdNot(String branchName, Integer branchId);
}