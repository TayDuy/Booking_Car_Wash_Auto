package com.autowash.backend.branch.controller;

import com.autowash.backend.branch.dto.BranchRequest;
import com.autowash.backend.branch.dto.BranchResponse;
import com.autowash.backend.branch.service.BranchService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class BranchController {
    private final BranchService branchService;

    //1.API tạo mới chi nhánh (POST /api/v1/admin/branches)
    @PostMapping("/admin/branches")
    public ResponseEntity<BranchResponse> createBranch(@Valid @RequestBody BranchRequest request){

        BranchResponse response = branchService.createBranch(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    //2.API Lấy danh sách toàn bộ chi nhánh (GET /api/v1/branches)
    @GetMapping("/branches")
    public ResponseEntity<List<BranchResponse>> getAllBranches(){
        List<BranchResponse> responses = branchService.getAllBranches();
        return ResponseEntity.ok(responses);
    }

    //3.API Lấy thông tin 1 chi nhánh theo ID (GET /api/v1/branches/{id})
    @GetMapping("/branches/{id}")
    public ResponseEntity<BranchResponse> getBranchById(@PathVariable("id") Integer id){
        BranchResponse response = branchService.getBranchById(id);
        return ResponseEntity.ok(response);
    }

    //4.API Cập nhật Chi nhánh (PUT /api/v1/branches/{id})
    @PutMapping("/admin/branches/{id}")
    public ResponseEntity<BranchResponse> updateBranch(@PathVariable("id") Integer id, @Valid @RequestBody BranchRequest request){
        BranchResponse response = branchService.updateBranch(id,request);
        return ResponseEntity.ok(response);
    }


}
