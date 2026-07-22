package com.autowash.backend.customer.service.impl;

import com.autowash.backend.customer.dto.AdminCreateCustomerRequestDTO;
import com.autowash.backend.customer.dto.AdminCreateCustomerResponseDTO;
import com.autowash.backend.customer.dto.CustomerProfileResponse;
import com.autowash.backend.customer.dto.CustomerUpdateRequest;
import com.autowash.backend.common.exception.BusinessException;
import com.autowash.backend.customer.entity.Customer;
import com.autowash.backend.customer.repository.CustomerRepository;
import com.autowash.backend.user.entity.User;
import com.autowash.backend.user.repository.UserRepository;
import com.autowash.backend.auditlog.service.AuditLogService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CustomerServiceImplTest {

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private AuditLogService auditLogService;

    @InjectMocks
    private CustomerServiceImpl customerService;

    @Test
    void testGetCustomerProfileSuccess() {
        User user = User.builder().id(1).email("test@gmail.com").phone("0912345678").build();
        Customer customer = Customer.builder()
                .customerId(10)
                .user(user)
                .fullName("Full Name")
                .gender("male")
                .tierId(1)
                .build();

        when(customerRepository.findByUser_Id(1)).thenReturn(Optional.of(customer));

        CustomerProfileResponse response = customerService.getCustomerProfile(1);

        assertNotNull(response);
        assertEquals("Full Name", response.getFullName());
        assertEquals("Nam", response.getGender());
    }

    @Test
    void testGetCustomerProfileNotFoundThrowsException() {
        when(customerRepository.findByUser_Id(1)).thenReturn(Optional.empty());

        BusinessException exception = assertThrows(BusinessException.class,
                () -> customerService.getCustomerProfile(1));
        assertEquals(HttpStatus.NOT_FOUND, exception.getHttpStatus());
        assertEquals("Không tìm thấy khách hàng", exception.getMessage());
    }

    @Test
    void testUpdateCustomerProfileSuccess() {
        User user = User.builder().id(1).email("old@gmail.com").phone("0912345678").build();
        Customer customer = Customer.builder()
                .customerId(10)
                .user(user)
                .fullName("Old Name")
                .gender("male")
                .build();

        CustomerUpdateRequest request = new CustomerUpdateRequest();
        request.setFullName("New Name");
        request.setGender("Nữ");
        request.setPhone("0987654321");
        request.setEmail("new@gmail.com");

        when(customerRepository.findByUser_Id(1)).thenReturn(Optional.of(customer));
        when(customerRepository.save(any(Customer.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CustomerProfileResponse response = customerService.updateCustomerProfile(1, request);

        assertNotNull(response);
        assertEquals("New Name", response.getFullName());
        assertEquals("Nữ", response.getGender());
        assertEquals("0987654321", customer.getUser().getPhone());
        assertEquals("new@gmail.com", customer.getUser().getEmail());
        verify(auditLogService, times(1)).log(anyString(), anyString(), anyInt(), anyString());
    }

    @Test
    void testCreateCustomerByStaffSuccess() {
        AdminCreateCustomerRequestDTO request = new AdminCreateCustomerRequestDTO();
        request.setUsername("staffcust");
        request.setEmail("staffcust@gmail.com");
        request.setPhone("0912345678");
        request.setFullName("Staff Cust");
        request.setPassword("password123");

        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(userRepository.existsByUsername(anyString())).thenReturn(false);
        when(userRepository.existsByPhone(anyString())).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("hashed-pwd");

        User savedUser = User.builder()
                .id(2)
                .username("staffcust")
                .email("staffcust@gmail.com")
                .build();
        when(userRepository.save(any(User.class))).thenReturn(savedUser);

        Customer savedCustomer = Customer.builder()
                .customerId(20)
                .fullName("Staff Cust")
                .build();
        when(customerRepository.save(any(Customer.class))).thenReturn(savedCustomer);

        AdminCreateCustomerResponseDTO response = customerService.createCustomerByStaff(request);

        assertNotNull(response);
        assertEquals(20, response.getCustomer().getCustomerId());
        assertEquals("Staff Cust", response.getCustomer().getFullName());
        assertNull(response.getGeneratedPassword());
    }

    @Test
    void testUpdateCustomer_UpdatesAllowDataSharing() {
        Customer customer = Customer.builder()
                .customerId(10)
                .fullName("Old Name")
                .gender("male")
                .allowDataSharing(false)
                .build();

        CustomerUpdateRequest request = new CustomerUpdateRequest();
        request.setFullName("New Name");
        request.setGender("Nam");
        request.setPhone("0987654321");
        request.setEmail("new@gmail.com");
        request.setAllowDataSharing(true);

        when(customerRepository.findById(10)).thenReturn(Optional.of(customer));
        when(customerRepository.save(any(Customer.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CustomerProfileResponse response = customerService.updateCustomer(10, request);

        assertNotNull(response);
        assertTrue(customer.getAllowDataSharing());
        assertEquals("New Name", customer.getFullName());
        verify(auditLogService, times(1)).log(anyString(), anyString(), anyInt(), anyString());
    }
}
