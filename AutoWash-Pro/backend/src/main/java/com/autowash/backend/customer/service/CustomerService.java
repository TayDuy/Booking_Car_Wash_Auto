package com.autowash.backend.customer.service;

import com.autowash.backend.customer.dto.AdminCreateCustomerRequestDTO;
import com.autowash.backend.customer.dto.AdminCreateCustomerResponseDTO;
import com.autowash.backend.customer.dto.CustomerProfileResponse;
import com.autowash.backend.customer.dto.CustomerUpdateRequest;
import java.util.List;

public interface CustomerService {
    CustomerProfileResponse getCustomerProfile(Integer userId);

    CustomerProfileResponse updateCustomerProfile(Integer userId, CustomerUpdateRequest request);
    List<CustomerProfileResponse> getAllCustomers();

    /**
     * STAFF/ADMIN tạo tài khoản khách hàng hộ — tạo đồng thời cả User + Customer.
     */
    AdminCreateCustomerResponseDTO createCustomerByStaff(AdminCreateCustomerRequestDTO request);

    CustomerProfileResponse updateCustomer(Integer customerId, CustomerUpdateRequest request);

    void deleteCustomer(Integer customerId);
}
