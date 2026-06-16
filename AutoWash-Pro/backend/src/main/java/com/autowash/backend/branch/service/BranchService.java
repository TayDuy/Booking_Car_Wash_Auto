package com.autowash.backend.branch.service;

import com.autowash.backend.branch.dto.BranchRequest;
import com.autowash.backend.branch.dto.BranchResponse;

import java.util.List;

public interface BranchService {
    BranchResponse createBranch(BranchRequest request);
    BranchResponse updateBranch(Integer branchId, BranchRequest request);
    BranchResponse getBranchById(Integer branchId);

    List<BranchResponse> getAllBranches();


}
