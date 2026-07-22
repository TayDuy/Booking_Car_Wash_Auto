package com.autowash.backend.customer.service.impl;

import com.autowash.backend.auditlog.service.AuditLogService;
import com.autowash.backend.common.exception.BusinessException;
import com.autowash.backend.customer.dto.AdminCreateCustomerRequestDTO;
import com.autowash.backend.customer.dto.AdminCreateCustomerResponseDTO;
import com.autowash.backend.customer.dto.CustomerProfileResponse;
import com.autowash.backend.customer.dto.CustomerUpdateRequest;
import com.autowash.backend.customer.entity.Customer;
import com.autowash.backend.customer.repository.CustomerRepository;
import com.autowash.backend.customer.service.CustomerService;
import com.autowash.backend.user.entity.User;
import com.autowash.backend.user.repository.UserRepository;
import com.autowash.backend.vehicle.dto.VehicleBriefResponse;
import com.autowash.backend.vehicle.entity.Vehicle;
import com.autowash.backend.vehicle.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
@Service
@RequiredArgsConstructor
public class CustomerServiceImpl implements CustomerService {

    private static final String CUSTOMER_NOT_FOUND_MSG = "Không tìm thấy khách hàng";
    private static final String ADMIN_USER = "admin";

    private final CustomerRepository customerRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditLogService auditLogService;
    private final VehicleRepository vehicleRepository;

    @Override
    @Transactional(readOnly = true)
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
        if (request.getAllowDataSharing() != null) {
            customer.setAllowDataSharing(request.getAllowDataSharing());
        }

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
    @Transactional(readOnly = true)
    public List<CustomerProfileResponse> getAllCustomers() {
        List<Customer> customers = customerRepository.findAllWithUser();

        Map<Integer, List<VehicleBriefResponse>> vehiclesByCustomer = Collections.emptyMap();
        if (!customers.isEmpty()) {
            List<Integer> customerIds = customers.stream()
                    .map(Customer::getCustomerId)
                    .toList();
            List<Vehicle> vehicles = vehicleRepository.findByCustomer_CustomerIdIn(customerIds);
            vehiclesByCustomer = vehicles.stream()
                    .collect(Collectors.groupingBy(
                            v -> v.getCustomer().getCustomerId(),
                            Collectors.mapping(this::toVehicleBrief, Collectors.toList())
                    ));
        }

        Map<Integer, List<VehicleBriefResponse>> finalMap = vehiclesByCustomer;
        return customers.stream()
                .map(c -> mapToResponse(c, finalMap.getOrDefault(c.getCustomerId(), List.of())))
                .toList();
    }

    /**
     * STAFF/ADMIN tạo tài khoản khách hàng hộ.
     * Tạo đồng thời User (tài khoản đăng nhập) + Customer (hồ sơ khách hàng).
     * Không yêu cầu xác minh OTP vì nhân viên đã xác minh trực tiếp với khách.
     */
    @Override
    @Transactional
    public AdminCreateCustomerResponseDTO createCustomerByStaff(AdminCreateCustomerRequestDTO request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();
        String normalizedUsername = request.getUsername().trim();
        String normalizedPhone = normalizePhone(request.getPhone());

        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new BusinessException("Email '" + normalizedEmail + "' đã được sử dụng", HttpStatus.CONFLICT);
        }
        if (userRepository.existsByUsername(normalizedUsername)) {
            throw new BusinessException("Tài khoản '" + normalizedUsername + "' đã được sử dụng", HttpStatus.CONFLICT);
        }
        if (userRepository.existsByPhone(normalizedPhone)) {
            throw new BusinessException("Số điện thoại '" + normalizedPhone + "' đã được sử dụng", HttpStatus.CONFLICT);
        }

        // Nếu nhân viên không nhập password thì tự sinh ngẫu nhiên để trả về 1 lần
        boolean autoGenerated = request.getPassword() == null || request.getPassword().isBlank();
        String rawPassword = autoGenerated
                ? UUID.randomUUID().toString().replace("-", "").substring(0, 10)
                : request.getPassword();

        User newUser = User.builder()
                .username(normalizedUsername)
                .email(normalizedEmail)
                .password(passwordEncoder.encode(rawPassword))
                .phone(normalizedPhone)
                .role("customer")
                .status("active")
                .build();
        User savedUser = userRepository.save(newUser);

        Customer newCustomer = Customer.builder()
                .user(savedUser)
                .fullName(request.getFullName().trim())
                .dateOfBirth(request.getDateOfBirth())
                .gender(translateGenderToEnglish(request.getGender()))
                .tierId(1)
                .build();
        Customer savedCustomer = customerRepository.save(newCustomer);
        // totalPoints/totalVisits/totalSpending/joinedAt là cột insertable=false (DB tự set default)
        // → load lại để response có giá trị đúng thay vì null.
        savedCustomer = customerRepository.findById(savedCustomer.getCustomerId()).orElse(savedCustomer);

        return AdminCreateCustomerResponseDTO.builder()
                .customer(mapToResponse(savedCustomer))
                .generatedPassword(autoGenerated ? rawPassword : null)
                .build();
    }

    /** Chuẩn hoá số điện thoại VN dạng 0xxxxxxxxx -> +84xxxxxxxxx, giống AuthServiceImpl. */
    private String normalizePhone(String phone) {
        String trimmed = phone == null ? "" : phone.trim();
        if (trimmed.startsWith("0") && trimmed.length() == 10) {
            return "+84" + trimmed.substring(1);
        }
        return trimmed;
    }

    private CustomerProfileResponse mapToResponse(Customer customer) {
        return mapToResponse(customer, List.of());
    }

    private CustomerProfileResponse mapToResponse(Customer customer, List<VehicleBriefResponse> vehicles) {
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
                .allowDataSharing(customer.getAllowDataSharing() != null ? customer.getAllowDataSharing() : false)
                .joinedAt(customer.getJoinedAt())
                .vehicles(vehicles)
                .build();
    }

    private VehicleBriefResponse toVehicleBrief(Vehicle vehicle) {
        String vt;
        if (vehicle.getVehicleType() == Vehicle.VehicleType.FOUR_SEATS) {
            vt = "car";
        } else if (vehicle.getVehicleType() == Vehicle.VehicleType.SEVEN_SEATS) {
            vt = "suv";
        } else {
            vt = "car";
        }
        return VehicleBriefResponse.builder()
                .vehicleId(vehicle.getVehicleId())
                .licensePlate(vehicle.getLicensePlate())
                .brand(vehicle.getBrand())
                .model(vehicle.getModel())
                .vehicleType(vt)
                .isActive(vehicle.getIsActive())
                .build();
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
        if (request.getAllowDataSharing() != null) {
            customer.setAllowDataSharing(request.getAllowDataSharing());
        }

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