package com.autowash.backend.customer.controller;

import com.autowash.backend.customer.dto.AdminCreateCustomerRequestDTO;
import com.autowash.backend.customer.dto.AdminCreateCustomerResponseDTO;
import com.autowash.backend.customer.service.CustomerService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * ==========================================================
 * STAFF CUSTOMER CONTROLLER
 * ==========================================================
 *
 * STAFF / ADMIN tạo tài khoản khách hàng hộ — dùng cho khách
 * walk-in tại quầy, khách đặt lịch qua điện thoại chưa có tài khoản, v.v.
 *
 * Tạo đồng thời cả User (tài khoản đăng nhập) + Customer (hồ sơ khách hàng).
 *
 * URL base:
 * /api/v1/staff/customers
 */
@RestController
@RequestMapping("/api/v1/staff/customers")
@RequiredArgsConstructor
public class StaffCustomerController {

    private final CustomerService customerService;

    /**
     * STAFF / ADMIN tạo khách hàng mới.
     *
     * POST:
     * /api/v1/staff/customers
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('EMPLOYEE','ADMIN')")
    public ResponseEntity<AdminCreateCustomerResponseDTO> createCustomer(
            @Valid @RequestBody AdminCreateCustomerRequestDTO request
    ) {
        AdminCreateCustomerResponseDTO response = customerService.createCustomerByStaff(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }
}