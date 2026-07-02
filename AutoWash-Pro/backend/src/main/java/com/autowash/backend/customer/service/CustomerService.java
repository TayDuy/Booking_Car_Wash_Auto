package com.autowash.backend.customer.service;

import com.autowash.backend.customer.dto.AdminCreateCustomerRequestDTO;
import com.autowash.backend.customer.dto.AdminCreateCustomerResponseDTO;
import com.autowash.backend.customer.dto.CustomerProfileResponse;
import com.autowash.backend.customer.dto.CustomerUpdateRequest;

public interface CustomerService {
    CustomerProfileResponse getCustomerProfile(Integer userId);

    CustomerProfileResponse updateCustomerProfile(Integer userId, CustomerUpdateRequest request);

    /**
     * STAFF/ADMIN tạo tài khoản khách hàng hộ — tạo đồng thời cả User + Customer.
     */
    AdminCreateCustomerResponseDTO createCustomerByStaff(AdminCreateCustomerRequestDTO request);
}