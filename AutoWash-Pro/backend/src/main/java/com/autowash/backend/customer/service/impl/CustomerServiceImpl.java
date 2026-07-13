package com.autowash.backend.customer.service.impl;

import com.autowash.backend.customer.dto.CustomerProfileResponse;
import com.autowash.backend.customer.dto.CustomerUpdateRequest;
import com.autowash.backend.common.exception.BusinessException;
import com.autowash.backend.customer.entity.Customer;
import com.autowash.backend.customer.repository.CustomerRepository;
import com.autowash.backend.customer.service.CustomerService;
import com.autowash.backend.loyaltytier.entity.LoyaltyTier;
import com.autowash.backend.loyaltytier.repository.LoyaltyTierRepository;
import org.springframework.http.HttpStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import com.autowash.backend.auditlog.service.AuditLogService;
@Service
@RequiredArgsConstructor
public class CustomerServiceImpl implements CustomerService {

    private static final String CUSTOMER_NOT_FOUND_MSG = "Không tìm thấy khách hàng";
    private static final String ADMIN_USER = "admin";

    private final CustomerRepository customerRepository;
    private final LoyaltyTierRepository loyaltyTierRepository;
    private final AuditLogService auditLogService;

    @Override
    public CustomerProfileResponse getCustomerProfile(Integer userId) {
        Customer customer = customerRepository.findByUser_Id(userId)  // ← fix
                .orElseThrow(() -> new BusinessException(CUSTOMER_NOT_FOUND_MSG, HttpStatus.NOT_FOUND));
        return mapToResponse(customer);
    }

    @Override
    @Transactional
    public CustomerProfileResponse updateCustomerProfile(Integer userId, CustomerUpdateRequest request) {
        Customer customer = customerRepository.findByUser_Id(userId)  // ← fix
                .orElseThrow(() -> new BusinessException(CUSTOMER_NOT_FOUND_MSG, HttpStatus.NOT_FOUND));

        customer.setFullName(request.getFullName());
        customer.setDateOfBirth(request.getDateOfBirth());
        customer.setGender(translateGenderToEnglish(request.getGender()));

        // Cập nhật số điện thoại và email của User liên kết
        if (customer.getUser() != null) {
            customer.getUser().setPhone(request.getPhone());
            customer.getUser().setEmail(request.getEmail());
        }

        Customer updateCustomer = customerRepository.save(customer);
        auditLogService.log(
                "UPDATE_PROFILE",
                ADMIN_USER,
                updateCustomer.getCustomerId(),
                "Khách hàng cập nhật hồ sơ"
        );
        return mapToResponse(updateCustomer);
    }
    @Override
    public List<CustomerProfileResponse> getAllCustomers() {
        return customerRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    private CustomerProfileResponse mapToResponse(Customer customer) {
        String tierName = resolveTierName(customer.getTierId());
        return CustomerProfileResponse.builder()
                .customerId(customer.getCustomerId())
                .username(customer.getUser() != null ? customer.getUser().getUsername() : null)
                .email(customer.getUser() != null ? customer.getUser().getEmail() : null)
                .phone(customer.getUser() != null ? customer.getUser().getPhone() : null)
                .fullName(customer.getFullName())
                .dateOfBirth(customer.getDateOfBirth())
                .gender(translateGenderToVietnamese(customer.getGender()))
                .totalPoints(customer.getTotalPoints())
                .totalVisits(customer.getTotalVisits())
                .totalSpending(customer.getTotalSpending())
                .tierId(customer.getTierId())
                .tierName(tierName)
                .joinedAt(customer.getJoinedAt())
                .build();
    }

    private String resolveTierName(Integer tierId) {
        if (tierId == null) return "Đồng";
        return loyaltyTierRepository.findById(tierId)
                .map(LoyaltyTier::getTierName)
                .orElse("Đồng");
    }
    private String translateGenderToEnglish(String gender) {
        if (gender == null) return null;
        if ("Nam".equalsIgnoreCase(gender)) return "male";
        if ("Nữ".equalsIgnoreCase(gender)) return "female";
        if ("Khác".equalsIgnoreCase(gender)) return "other";
        return gender;
    }

    private String translateGenderToVietnamese(String gender) {
        if (gender == null) return null;
        if ("male".equalsIgnoreCase(gender)) return "Nam";
        if ("female".equalsIgnoreCase(gender)) return "Nữ";
        if ("other".equalsIgnoreCase(gender)) return "Khác";
        return gender;
    }

    @Override
    @Transactional
    public CustomerProfileResponse updateCustomer(Integer customerId, CustomerUpdateRequest request) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new BusinessException(CUSTOMER_NOT_FOUND_MSG, HttpStatus.NOT_FOUND));

        customer.setFullName(request.getFullName());
        customer.setDateOfBirth(request.getDateOfBirth());
        customer.setGender(translateGenderToEnglish(request.getGender()));

        if (customer.getUser() != null) {
            customer.getUser().setPhone(request.getPhone());
            customer.getUser().setEmail(request.getEmail());
        }

        Customer updatedCustomer = customerRepository.save(customer);
        auditLogService.log(
                "UPDATE_CUSTOMER",
                ADMIN_USER,
                updatedCustomer.getCustomerId(),
                "Admin cập nhật khách hàng " + updatedCustomer.getFullName()
        );
        return mapToResponse(updatedCustomer);
    }

    @Override
    @Transactional
    public void deleteCustomer(Integer customerId) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new BusinessException(CUSTOMER_NOT_FOUND_MSG, HttpStatus.NOT_FOUND));

        if (customer.getUser() != null) {
            customer.getUser().setStatus("inactive");
            auditLogService.log(
                    "DELETE_CUSTOMER",
                    ADMIN_USER,
                    customer.getCustomerId(),
                    "Khóa khách hàng " + customer.getFullName()
            );
        }
    }
}
