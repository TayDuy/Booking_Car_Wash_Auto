package com.autowash.backend.washbay.repository;

import com.autowash.backend.washbay.entity.WashBay;
import com.autowash.backend.washbay.entity.WashBay.BayStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WashBayRepository extends JpaRepository<WashBay, Integer> {

    List<WashBay> findByBranch_BranchId(Integer branchId);

    List<WashBay> findByBranch_BranchIdAndStatus(Integer branchId, BayStatus status);
}