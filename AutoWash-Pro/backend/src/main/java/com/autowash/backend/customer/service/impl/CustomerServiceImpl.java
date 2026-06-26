package com.autowash.backend.customer.service.impl;

import com.autowash.backend.customer.dto.CustomerProfileResponse;
import com.autowash.backend.customer.dto.CustomerUpdateRequest;
import com.autowash.backend.common.exception.BusinessException;
import com.autowash.backend.customer.entity.Customer;
import com.autowash.backend.customer.repository.CustomerRepository;
import com.autowash.backend.customer.service.CustomerService;
import org.springframework.http.HttpStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CustomerServiceImpl implements CustomerService {

    private final CustomerRepository customerRepository;

    @Override
    public CustomerProfileResponse getCustomerProfile(Integer userId) {
        Customer customer = customerRepository.findByUser_Id(userId)  // ← fix
                .orElseThrow(() -> new BusinessException("Không tìm thấy khách hàng", HttpStatus.NOT_FOUND));
        return mapToResponse(customer);
    }

    @Override
    @Transactional
    public CustomerProfileResponse updateCustomerProfile(Integer userId, CustomerUpdateRequest request) {
        Customer customer = customerRepository.findByUser_Id(userId)  // ← fix
                .orElseThrow(() -> new BusinessException("Không tìm thấy khách hàng", HttpStatus.NOT_FOUND));

        customer.setFullName(request.getFullName());
        customer.setDateOfBirth(request.getDateOfBirth());
        customer.setGender(request.getGender());
        Customer updateCustomer = customerRepository.save(customer);
        return mapToResponse(updateCustomer);
    }

    private CustomerProfileResponse mapToResponse(Customer customer) {
        return CustomerProfileResponse.builder()
                .fullName(customer.getFullName())
                .dateOfBirth(customer.getDateOfBirth())
                .gender(customer.getGender())
                .totalPoints(customer.getTotalPoints())
                .totalVisits(customer.getTotalVisits())
                .totalSpending(customer.getTotalSpending())
                .tierId(customer.getTierId())
                .joinedAt(customer.getJoinedAt())
                .build();
    }
}