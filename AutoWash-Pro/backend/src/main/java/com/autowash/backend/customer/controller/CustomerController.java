package com.autowash.backend.customer.controller;

import com.autowash.backend.customer.dto.CustomerProfileResponse;
import com.autowash.backend.customer.dto.CustomerUpdateRequest;
import com.autowash.backend.customer.service.CustomerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/customers")
@RequiredArgsConstructor
public class CustomerController {

    private final CustomerService customerService;

    // Lấy profile của chính mình
    @GetMapping("/me")
    public ResponseEntity<CustomerProfileResponse> getMyProfile(
            @org.springframework.security.core.annotation.AuthenticationPrincipal com.autowash.backend.security.CustomUserDetails userDetails) {
        return ResponseEntity.ok(customerService.getCustomerProfile(userDetails.getId()));
    }

    // Cập nhật profile của chính mình
    @PutMapping("/me")
    public ResponseEntity<CustomerProfileResponse> updateMyProfile(
            @org.springframework.security.core.annotation.AuthenticationPrincipal com.autowash.backend.security.CustomUserDetails userDetails,
            @Valid @RequestBody CustomerUpdateRequest request) {
        return ResponseEntity.ok(customerService.updateCustomerProfile(userDetails.getId(), request));
    }

    @GetMapping
    public ResponseEntity<List<CustomerProfileResponse>> getAllCustomers() {
        return ResponseEntity.ok(customerService.getAllCustomers());
    }

    @PutMapping("/{customerId}")
    public ResponseEntity<CustomerProfileResponse> updateCustomer(
            @PathVariable Integer customerId,
            @Valid @RequestBody CustomerUpdateRequest request
    ) {
        return ResponseEntity.ok(
                customerService.updateCustomer(customerId, request)
        );
    }

    @DeleteMapping("/{customerId}")
    public ResponseEntity<Void> deleteCustomer(
            @PathVariable Integer customerId
    ) {
        customerService.deleteCustomer(customerId);
        return ResponseEntity.noContent().build();
    }
}