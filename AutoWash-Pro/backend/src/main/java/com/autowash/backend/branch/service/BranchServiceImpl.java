package com.autowash.backend.branch.service;

import com.autowash.backend.branch.dto.BranchRequest;
import com.autowash.backend.branch.dto.BranchResponse;
import com.autowash.backend.branch.entity.Branch;
import com.autowash.backend.branch.repository.BranchRepository;
import com.autowash.backend.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BranchServiceImpl implements BranchService{
    private final BranchRepository branchRepository;

    @Override
    public BranchResponse createBranch(BranchRequest request) {
        Branch branch = Branch.builder()
                .branchName(request.getBranchName())
                .address(request.getAddress())
                .phone(request.getPhone())
                .capacity(request.getCapacity() != null ? request.getCapacity() : 1)
                .status(request.getStatus())
                .build();
        return mapToResponse(branchRepository.save(branch));
    }

    @Override
    public BranchResponse updateBranch(Integer branchId, BranchRequest request) {
        Branch branch = branchRepository.findById(branchId)
                .orElseThrow(() -> new ResourceNotFoundException("Chi nhánh", "id", branchId));
        branch.setBranchName(request.getBranchName());
        branch.setAddress(request.getAddress());
        branch.setPhone(request.getPhone());
        if (request.getCapacity() != null)
            branch.setStatus(request.getStatus());

        return mapToResponse(branchRepository.save(branch));
    }

    @Override
    public BranchResponse getBranchById(Integer branchId) {
        Branch branch = branchRepository.findById(branchId)
                .orElseThrow(() -> new ResourceNotFoundException("Chi nhánh", "id", branchId));

        return mapToResponse(branch);
    }

    @Override
    public List<BranchResponse> getAllBranches() {
        return branchRepository.findAll().stream().map(this::mapToResponse).toList();
    }
    private BranchResponse mapToResponse(Branch branch) {
        return BranchResponse.builder()
                .branchId(branch.getBranchId())
                .branchName(branch.getBranchName())
                .address(branch.getAddress())
                .phone(branch.getPhone())
                .capacity(branch.getCapacity())
                .status(branch.getStatus())
                .createdAt(branch.getCreatedAt())
                .updatedAt(branch.getUpdatedAt())
                .build();
    }
}
