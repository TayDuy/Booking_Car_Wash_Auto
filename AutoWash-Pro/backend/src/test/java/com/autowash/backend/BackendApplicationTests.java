package com.autowash.backend;

import com.autowash.backend.user.entity.User;
import com.autowash.backend.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

@SpringBootTest
class BackendApplicationTests {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @Test
    void testQueryGenderValues() {
        try {
            java.util.List<String> genders = jdbcTemplate.queryForList(
                "SELECT DISTINCT gender FROM customer",
                String.class
            );
            System.out.println("=== UNIQUE GENDERS IN DATABASE: " + genders);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }





    @Autowired
    private com.autowash.backend.customer.repository.CustomerRepository customerRepository;

    @Autowired
    private com.autowash.backend.vehicle.repository.VehicleRepository vehicleRepository;

    @Autowired
    private com.autowash.backend.customer.service.CustomerService customerService;

    @Test
    void testSaveKhacGenderFails() {
        System.out.println("=== START SAVE KHAC GENDER FAILS TEST ===");
        
        com.autowash.backend.customer.entity.Customer customer = customerRepository.findAll().stream()
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("No customer found"));

        // Use a new transaction/EntityManager if possible, or just catch the exception
        try {
            customer.setGender("Khác");
            customerRepository.saveAndFlush(customer);
            org.junit.jupiter.api.Assertions.fail("Should have thrown DataIntegrityViolationException");
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            System.out.println("=== EXPECTED FAILURE CAUGHT: " + e.getMessage());
        }
    }

    @Test
    @org.springframework.transaction.annotation.Transactional
    void testSaveKhacGenderSucceeds() {
        System.out.println("=== START SAVE KHAC GENDER SUCCEEDS TEST ===");
        
        com.autowash.backend.customer.entity.Customer customer = customerRepository.findAll().stream()
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("No customer found"));

        String originalGender = customer.getGender();
        Integer userId = customer.getUser().getId();

        try {
            com.autowash.backend.customer.dto.CustomerUpdateRequest request = new com.autowash.backend.customer.dto.CustomerUpdateRequest();
            request.setFullName(customer.getFullName());
            request.setDateOfBirth(customer.getDateOfBirth());
            request.setGender("Khác");
            if (customer.getUser() != null) {
                request.setPhone(customer.getUser().getPhone());
                request.setEmail(customer.getUser().getEmail());
            }

            com.autowash.backend.customer.dto.CustomerProfileResponse response = customerService.updateCustomerProfile(userId, request);
            org.junit.jupiter.api.Assertions.assertEquals("Khác", response.getGender());

            // Check what is actually stored in database
            com.autowash.backend.customer.entity.Customer updatedCustomer = customerRepository.findById(customer.getCustomerId()).get();
            org.junit.jupiter.api.Assertions.assertEquals("other", updatedCustomer.getGender());

            System.out.println("=== SAVE KHAC GENDER SUCCEEDS TEST SUCCESS ===");
        } finally {
            // Restore original gender
            customer.setGender(originalGender);
            customerRepository.saveAndFlush(customer);
        }
    }



    @Test
    void testSaveSuvVehicle() {
        System.out.println("=== START SUV VEHICLE SAVE TEST ===");
        
        try {
            System.out.println("=== ALTERING CONSTRAINT IN TEST ===");
            jdbcTemplate.execute("ALTER TABLE vehicle DROP CONSTRAINT IF EXISTS vehicle_vehicle_type_check");
            jdbcTemplate.execute("ALTER TABLE vehicle ADD CONSTRAINT vehicle_vehicle_type_check CHECK (vehicle_type::text = ANY (ARRAY['car'::text, 'suv'::text, 'truck'::text, 'motorbike'::text]))");
            
            String constraintDef = jdbcTemplate.queryForObject(
                "SELECT pg_get_constraintdef(oid) FROM pg_constraint WHERE conname = 'vehicle_vehicle_type_check'",
                String.class
            );
            System.out.println("=== CURRENT CONSTRAINT DEFINITION: " + constraintDef);
        } catch (Exception e) {
            e.printStackTrace();
        }

        com.autowash.backend.customer.entity.Customer customer = customerRepository.findAll().stream()
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("No customer found in the database"));

        String testLicensePlate = "SUV" + (System.currentTimeMillis() % 10000000);
        
        // Clean up if somehow it already exists
        vehicleRepository.findByLicensePlate(testLicensePlate).ifPresent(v -> {
            vehicleRepository.delete(v);
        });

        com.autowash.backend.vehicle.entity.Vehicle vehicle = com.autowash.backend.vehicle.entity.Vehicle.builder()
                .customer(customer)
                .licensePlate(testLicensePlate)
                .brand("Ford")
                .model("Everest")
                .vehicleType(com.autowash.backend.vehicle.entity.Vehicle.VehicleType.suv)
                .color("Vàng")
                .nickname("Test SUV")
                .isActive(true)
                .build();

        com.autowash.backend.vehicle.entity.Vehicle savedVehicle = vehicleRepository.save(vehicle);
        org.junit.jupiter.api.Assertions.assertNotNull(savedVehicle.getVehicleId());
        org.junit.jupiter.api.Assertions.assertEquals(com.autowash.backend.vehicle.entity.Vehicle.VehicleType.suv, savedVehicle.getVehicleType());

        // Clean up
        vehicleRepository.delete(savedVehicle);

        System.out.println("=== SUV VEHICLE SAVE TEST SUCCESS ===");
    }


    @Test
    void testVehicleRequestValidation() {
        jakarta.validation.ValidatorFactory factory = jakarta.validation.Validation.buildDefaultValidatorFactory();
        jakarta.validation.Validator validator = factory.getValidator();

        java.util.List<String> validPlates = java.util.List.of(
            "51A-999.99",
            "51a-99999",
            "30A-1234",
            "51B-123.4",
            "51b-123.45"
        );

        for (String plate : validPlates) {
            com.autowash.backend.vehicle.dto.VehicleRequest request = new com.autowash.backend.vehicle.dto.VehicleRequest();
            request.setLicensePlate(plate);
            request.setBrand("Ford");
            request.setModel("Everest");
            request.setVehicleType(com.autowash.backend.vehicle.entity.Vehicle.VehicleType.suv);

            java.util.Set<jakarta.validation.ConstraintViolation<com.autowash.backend.vehicle.dto.VehicleRequest>> violations = validator.validate(request);
            org.junit.jupiter.api.Assertions.assertTrue(violations.isEmpty(), "Plate " + plate + " should be valid but has violations: " + violations);
        }
    }

    @Test
    @org.springframework.transaction.annotation.Transactional
    void testSaveVariousLicensePlates() {
        System.out.println("=== START TEST SAVE VARIOUS LICENSE PLATES ===");
        
        com.autowash.backend.customer.entity.Customer customer = customerRepository.findAll().stream()
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("No customer found"));

        java.util.List<String> plates = java.util.List.of(
            "51A-999.99",
            "51a-99999",
            " 51A-99999 "
        );

        for (String rawPlate : plates) {
            String normalizedPlate = rawPlate.trim().toUpperCase();
            
            // Clean up if somehow it already exists
            vehicleRepository.findByLicensePlate(normalizedPlate).ifPresent(v -> {
                vehicleRepository.delete(v);
                vehicleRepository.flush();
            });

            com.autowash.backend.vehicle.entity.Vehicle vehicle = com.autowash.backend.vehicle.entity.Vehicle.builder()
                    .customer(customer)
                    .licensePlate(normalizedPlate)
                    .brand("Ford")
                    .model("Everest")
                    .vehicleType(com.autowash.backend.vehicle.entity.Vehicle.VehicleType.suv)
                    .color("Vàng")
                    .nickname("Test Plate " + normalizedPlate)
                    .isActive(true)
                    .build();

            com.autowash.backend.vehicle.entity.Vehicle savedVehicle = vehicleRepository.save(vehicle);
            org.junit.jupiter.api.Assertions.assertNotNull(savedVehicle.getVehicleId());
            org.junit.jupiter.api.Assertions.assertEquals(normalizedPlate, savedVehicle.getLicensePlate());

            // Clean up
            vehicleRepository.delete(savedVehicle);
        }
        
        System.out.println("=== TEST SAVE VARIOUS LICENSE PLATES SUCCESS ===");
    }

    @Test
    void testAuthDirectly() {
        System.out.println("=== START PASSWORD UPDATE ===");
        String encoded = passwordEncoder.encode("123456");
        
        userRepository.findByUsernameOrEmail("admin.minh", "minh.admin@autowash.vn").ifPresent(user -> {
            user.setPassword(encoded);
            userRepository.save(user);
            System.out.println("Updated admin.minh password to encoded '123456': " + encoded);
        });

        userRepository.findByUsernameOrEmail("staff.tanpd", "tan.pd@autowash.vn").ifPresent(user -> {
            user.setPassword(encoded);
            userRepository.save(user);
            System.out.println("Updated staff.tanpd password to encoded '123456': " + encoded);
        });

        userRepository.findByUsernameOrEmail("khoavh", "khoavh@gmail.com").ifPresent(user -> {
            user.setPassword(encoded);
            userRepository.save(user);
            System.out.println("Updated khoavh password to encoded '123456': " + encoded);
        });
        System.out.println("=== END PASSWORD UPDATE ===");
    }

    @Test
    void hashAllPlaintextPasswords() {
        System.out.println("=== START HASHING ALL PLAINTEXT PASSWORDS ===");
        java.util.List<User> users = userRepository.findAll();
        int count = 0;
        for (User user : users) {
            String pass = user.getPassword();
            if (pass != null && !pass.startsWith("$2a$") && !pass.startsWith("$2b$") && !pass.startsWith("$2y$")) {
                String encoded = passwordEncoder.encode(pass);
                user.setPassword(encoded);
                userRepository.save(user);
                System.out.println("Hashed password for user: " + user.getUsername() + " (Email: " + user.getEmail() + ")");
                count++;
            }
        }
        System.out.println("=== FINISHED. HASHED " + count + " PLAINTEXT PASSWORDS ===");
    }

    @Test
    void testCheckHungdh() {
        userRepository.findByUsernameOrEmail("hungdh", "hungdh@gmail.com").ifPresent(user -> {
            System.out.println("=== USER FOUND ===");
            System.out.println("Username: " + user.getUsername());
            System.out.println("Email: " + user.getEmail());
            System.out.println("Password Hash: " + user.getPassword());
            System.out.println("Length: " + user.getPassword().length());
            System.out.println("Matches '914411': " + passwordEncoder.matches("914411", user.getPassword()));
            System.out.println("Matches '123456': " + passwordEncoder.matches("123456", user.getPassword()));
        });
    }

    @Autowired
    private com.autowash.backend.auth.service.AuthService authService;

    @Autowired
    private com.autowash.backend.auth.service.RefreshTokenService refreshTokenService;

    @Test
    void testRefreshTokenFlow() {
        try {
            // Lay 1 user
            User user = userRepository.findAll().stream().findFirst().orElseThrow();
            
            // Tao refresh token
            com.autowash.backend.auth.entity.RefreshToken rt = refreshTokenService.createRefreshToken(user.getId());
            System.out.println("=== REFRESH TOKEN CREATED ===");
            System.out.println("Token: " + rt.getToken());
            System.out.println("Expiry Date: " + rt.getExpriryDate());
            
            // Thu verify
            com.autowash.backend.auth.entity.RefreshToken verified = refreshTokenService.verifyExpiration(rt);
            System.out.println("=== REFRESH TOKEN VERIFIED ===");
            System.out.println("Verified Expiry: " + verified.getExpriryDate());
            
            // Thu find
            com.autowash.backend.auth.entity.RefreshToken found = refreshTokenService.findByToken(rt.getToken());
            System.out.println("=== REFRESH TOKEN FOUND ===");
            System.out.println("Found ID: " + found.getId());
        } catch (Exception e) {
            e.printStackTrace();
            org.junit.jupiter.api.Assertions.fail(e.getMessage());
        }
    }

    @Test
    void testLoginHungdh() {
        try {
            com.autowash.backend.auth.dto.LoginRequestDTO req = new com.autowash.backend.auth.dto.LoginRequestDTO();
            req.setUsername("hungdh");
            req.setPassword("914411");
            com.autowash.backend.auth.dto.LoginResponseDTO resp = authService.login(req);
            System.out.println("=== LOGIN SUCCESSFUL ===");
            System.out.println("Token: " + resp.getAccessToken());
        } catch (Exception e) {
            System.out.println("=== LOGIN FAILED ===");
            e.printStackTrace();
        }
    }
}


