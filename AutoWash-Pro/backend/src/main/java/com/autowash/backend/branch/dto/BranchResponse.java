package com.autowash.backend.branch.dto;

import com.autowash.backend.branch.entity.Branch.BranchStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BranchResponse {
    private Integer branchId;
    private String branchName;
    private String address;
    private String phone;
    private Integer capacity;
    private BranchStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

}
