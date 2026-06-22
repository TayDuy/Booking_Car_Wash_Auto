package com.autowash.backend.branch.dto;

import com.autowash.backend.branch.entity.Branch.BranchStatus;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class BranchRequest {
    @NotBlank(message = "Tên chi nhánh không được để trống")
    @Size(max = 100)
    private String branchName;

    @NotBlank(message = "Địa chỉ không được để trống")
    private String address;

    @NotBlank(message = "Số điện thoại không được để trống")
    private String phone;

    @Min(value = 1)
    private Integer capacity;

    @NotNull
    private BranchStatus status;
}
