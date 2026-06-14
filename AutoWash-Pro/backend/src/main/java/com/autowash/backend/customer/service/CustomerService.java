package com.autowash.backend.customer.service;

import com.autowash.backend.customer.dto.CustomerProfileResponse;
import com.autowash.backend.customer.dto.CustomerUpdateRequest;

public interface CustomerService {
    CustomerProfileResponse getCustomerProfile(Integer userId);

    CustomerProfileResponse updateCustomerProfile(Integer userId, CustomerUpdateRequest request);
}
