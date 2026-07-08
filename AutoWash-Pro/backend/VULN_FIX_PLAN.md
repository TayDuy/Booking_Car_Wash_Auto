# VULN_FIX_PLAN - AutoWash-Pro Backend Vulnerability Remediation

This document contains the exact steps and code changes required to fix the 5 security vulnerabilities identified by the Strix security scanner. 

Please read and apply the following modifications surgically.

---

## Task 1: Configuration Hardening (vuln-0001)

### File: `src/main/resources/application.properties`

1. **Locate line 19:**
   ```properties
   spring.jpa.hibernate.ddl-auto=${DDL_AUTO:update}
   ```
   **Change to:**
   ```properties
   spring.jpa.hibernate.ddl-auto=${DDL_AUTO:validate}
   ```

2. **Locate line 32:**
   ```properties
   supabase.anon-key=${SUPABASE_ANON_KEY:eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxa3dlZmN4ZXpkZ2Rkb2JnZmZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4MzM1MTUsImV4cCI6MjA5NjQwOTUxNX0.rmJJzJ9GysBrFfvQ-pNtZKaajSC-pjtWR6b7HYGsm90}
   ```
   **Change to:**
   ```properties
   supabase.anon-key=${SUPABASE_ANON_KEY:placeholder_anon_key}
   ```

---

## Task 2: IDOR Protection in Reward/Redeem Flows (vuln-0002)

### File 2.1: `src/main/java/com/autowash/backend/customerreward/controller/CustomerRewardController.java`
Update the endpoints to fetch the authenticated user ID (`userDetails.getId()`) and pass it to the service layers. Add `@PreAuthorize`.

**Apply this diff:**
```diff
-package com.autowash.backend.customerreward.controller;
-
-import com.autowash.backend.customerreward.dto.CustomerRewardResponseDTO;
-import com.autowash.backend.customerreward.service.CustomerRewardService;
-import lombok.RequiredArgsConstructor;
-import org.springframework.http.ResponseEntity;
-import org.springframework.web.bind.annotation.*;
-
-import java.util.List;
-
-@RestController
-@RequestMapping("/api/v1/customer/rewards")
-@RequiredArgsConstructor
-public class CustomerRewardController {
-
-    private final CustomerRewardService customerRewardService;
-
-    /**
-     * Customer đổi điểm lấy voucher.
-     */
-    @PostMapping("/{rewardId}/redeem")
-    public ResponseEntity<CustomerRewardResponseDTO> redeemReward(
-            @PathVariable Integer rewardId,
-            @RequestParam Integer customerId
-    ) {
-        CustomerRewardResponseDTO response = customerRewardService.redeemReward(
-                customerId,
-                rewardId,
-                null
-        );
-
-        return ResponseEntity.ok(response);
-    }
-
-    /**
-     * Customer xem voucher đã đổi.
-     */
-    @GetMapping("/my/{customerId}")
-    public ResponseEntity<List<CustomerRewardResponseDTO>> getMyRewards(
-            @PathVariable Integer customerId
-    ) {
-        List<CustomerRewardResponseDTO> response =
-                customerRewardService.getCustomerRewards(customerId, null);
-
-        return ResponseEntity.ok(response);
-    }
-
-    @PatchMapping("/use")
-    public ResponseEntity<CustomerRewardResponseDTO> useReward(
-            @RequestParam String voucherCode,
-            @RequestParam Integer bookingId
-    ) {
-        CustomerRewardResponseDTO response =
-                customerRewardService.useReward(voucherCode, bookingId, null);
-
-        return ResponseEntity.ok(response);
-    }
-}
+package com.autowash.backend.customerreward.controller;
+
+import com.autowash.backend.customerreward.dto.CustomerRewardResponseDTO;
+import com.autowash.backend.customerreward.service.CustomerRewardService;
+import com.autowash.backend.security.CustomUserDetails;
+import lombok.RequiredArgsConstructor;
+import org.springframework.http.ResponseEntity;
+import org.springframework.security.access.prepost.PreAuthorize;
+import org.springframework.security.core.annotation.AuthenticationPrincipal;
+import org.springframework.web.bind.annotation.*;
+
+import java.util.List;
+
+@RestController
+@RequestMapping("/api/v1/customer/rewards")
+@RequiredArgsConstructor
+@PreAuthorize("hasAnyRole('CUSTOMER', 'STAFF', 'ADMIN')")
+public class CustomerRewardController {
+
+    private final CustomerRewardService customerRewardService;
+
+    /**
+     * Customer đổi điểm lấy voucher.
+     */
+    @PostMapping("/{rewardId}/redeem")
+    public ResponseEntity<CustomerRewardResponseDTO> redeemReward(
+            @PathVariable Integer rewardId,
+            @RequestParam Integer customerId,
+            @AuthenticationPrincipal CustomUserDetails userDetails
+    ) {
+        CustomerRewardResponseDTO response = customerRewardService.redeemReward(
+                customerId,
+                rewardId,
+                userDetails.getId()
+        );
+
+        return ResponseEntity.ok(response);
+    }
+
+    /**
+     * Customer xem voucher đã đổi.
+     */
+    @GetMapping("/my/{customerId}")
+    public ResponseEntity<List<CustomerRewardResponseDTO>> getMyRewards(
+            @PathVariable Integer customerId,
+            @AuthenticationPrincipal CustomUserDetails userDetails
+    ) {
+        List<CustomerRewardResponseDTO> response =
+                customerRewardService.getCustomerRewards(customerId, userDetails.getId());
+
+        return ResponseEntity.ok(response);
+    }
+
+    @PatchMapping("/use")
+    public ResponseEntity<CustomerRewardResponseDTO> useReward(
+            @RequestParam String voucherCode,
+            @RequestParam Integer bookingId,
+            @AuthenticationPrincipal CustomUserDetails userDetails
+    ) {
+        CustomerRewardResponseDTO response =
+                customerRewardService.useReward(voucherCode, bookingId, userDetails.getId());
+
+        return ResponseEntity.ok(response);
+    }
+}
```

### File 2.2: `src/main/java/com/autowash/backend/customerreward/service/impl/CustomerRewardServiceImpl.java`
Inject `UserRepository` and update ownership verification to allow `ADMIN` and `STAFF` to bypass checks.

**Apply this diff:**
```diff
@@ -38,3 +38,4 @@
     private final LoyaltyTransactionService loyaltyTransactionService;
     private final CustomerRewardMapper customerRewardMapper;
+    private final com.autowash.backend.user.repository.UserRepository userRepository;
 
     @Override
@@ -162,18 +163,33 @@
 
     private void validateCustomerOwner(Integer customerId, Integer userId) {
         if (userId == null) {
-            return;
-        }
-
+            throw new BusinessException(
+                    "Không thể xác thực người dùng",
+                    HttpStatus.FORBIDDEN
+            );
+        }
+
+        com.autowash.backend.user.entity.User user = userRepository.findById(userId)
+                .orElseThrow(() -> new BusinessException(
+                        "Không tìm thấy tài khoản người dùng",
+                        HttpStatus.FORBIDDEN
+                ));
+
+        String role = user.getRole();
+        if ("admin".equalsIgnoreCase(role) || "staff".equalsIgnoreCase(role)) {
+            return;
+        }
+
         Customer authenticatedCustomer = customerRepository.findByUser_Id(userId)
                 .orElseThrow(() -> new BusinessException(
                         "Không tìm thấy khách hàng ứng với tài khoản đăng nhập",
                         HttpStatus.FORBIDDEN
                 ));
 
         if (!authenticatedCustomer.getCustomerId().equals(customerId)) {
             throw new BusinessException(
                     "Bạn không có quyền thao tác với dữ liệu của khách hàng khác",
                     HttpStatus.FORBIDDEN
             );
         }
     }
```

### File 2.3: `src/main/java/com/autowash/backend/payment/controller/RedeemController.java`
Update `/api/v1/redeem` to accept `@AuthenticationPrincipal CustomUserDetails userDetails` and forward it.

**Apply this diff:**
```diff
@@ -82,5 +82,9 @@
     @PostMapping
-    public ResponseEntity<RedeemResponseDTO> redeem(@Valid @RequestBody RedeemRequestDTO dto) {
-        return ResponseEntity.ok(redeemService.redeem(dto));
-    }
+    public ResponseEntity<RedeemResponseDTO> redeem(
+            @Valid @RequestBody RedeemRequestDTO dto,
+            @org.springframework.security.core.annotation.AuthenticationPrincipal com.autowash.backend.security.CustomUserDetails userDetails
+    ) {
+        return ResponseEntity.ok(redeemService.redeem(dto, userDetails.getId()));
+    }
```

### File 2.4: `src/main/java/com/autowash/backend/payment/service/RedeemService.java`
Change method signature to accept `Integer userId`, inject `UserRepository`, and perform ownership validation.

**Apply this diff:**
```diff
@@ -29,3 +29,4 @@
     private final PaymentRepository            paymentRepository;
+    private final com.autowash.backend.user.repository.UserRepository userRepository;
 
     @Transactional
-    public RedeemResponseDTO redeem(RedeemRequestDTO dto) {
+    public RedeemResponseDTO redeem(RedeemRequestDTO dto, Integer userId) {
+
+        // Validate ownership
+        if (userId == null) {
+            throw new BusinessException("Yêu cầu xác thực người dùng", HttpStatus.FORBIDDEN);
+        }
+
+        com.autowash.backend.user.entity.User user = userRepository.findById(userId)
+                .orElseThrow(() -> new BusinessException("Không tìm thấy tài khoản", HttpStatus.FORBIDDEN));
+
+        if (!"admin".equalsIgnoreCase(user.getRole()) && !"staff".equalsIgnoreCase(user.getRole())) {
+            Customer authenticatedCustomer = customerRepository.findByUser_Id(userId)
+                    .orElseThrow(() -> new BusinessException(
+                            "Không tìm thấy khách hàng ứng với tài khoản đăng nhập",
+                            HttpStatus.FORBIDDEN
+                    ));
+            if (!authenticatedCustomer.getCustomerId().equals(dto.getCustomerId())) {
+                throw new BusinessException(
+                        "Bạn không có quyền đổi điểm cho khách hàng khác",
+                        HttpStatus.FORBIDDEN
+                );
+            }
+        }
```

### File 2.5: `src/main/java/com/autowash/backend/reward/controller/RewardController.java`
Secure the redeemable endpoint with `@PreAuthorize` and forward authenticated `userId`.

**Apply this diff:**
```diff
@@ -10,2 +10,3 @@
 import org.springframework.security.access.prepost.PreAuthorize;
+import org.springframework.security.core.annotation.AuthenticationPrincipal;
 import org.springframework.web.bind.annotation.*;
@@ -134,8 +135,10 @@
      */
+    @PreAuthorize("hasAnyRole('CUSTOMER', 'STAFF', 'ADMIN')")
     @GetMapping("/redeemable")
     public ResponseEntity<List<RewardResponseDTO>> getRedeemableRewards(
             @RequestParam Integer customerId,
-            @RequestParam String vehicleType
-    ) {
-        List<RewardResponseDTO> rewards =
-                rewardService.getRedeemableRewards(customerId, vehicleType);
+            @RequestParam String vehicleType,
+            @AuthenticationPrincipal com.autowash.backend.security.CustomUserDetails userDetails
+    ) {
+        List<RewardResponseDTO> rewards =
+                rewardService.getRedeemableRewards(customerId, vehicleType, userDetails.getId());
 
@@ -151,8 +154,9 @@
     @PostMapping("/{id}/redeem")
     @PreAuthorize("hasAnyRole('CUSTOMER', 'STAFF', 'ADMIN')")
     public ResponseEntity<RedeemRewardResponseDTO> redeemReward(
             @PathVariable("id") Integer rewardId,
-            @Valid @RequestBody RedeemRewardRequestDTO dto
-    ) {
+            @Valid @RequestBody RedeemRewardRequestDTO dto,
+            @AuthenticationPrincipal com.autowash.backend.security.CustomUserDetails userDetails
+    ) {
         RedeemRewardResponseDTO response =
-                rewardService.redeemReward(rewardId, dto);
+                rewardService.redeemReward(rewardId, dto, userDetails.getId());
```

### File 2.6: `src/main/java/com/autowash/backend/reward/service/RewardService.java`
Update signatures to receive `Integer userId`.

**Apply this diff:**
```diff
@@ -76,3 +76,3 @@
      */
-    List<RewardResponseDTO> getRedeemableRewards(Integer customerId, String vehicleType);
+    List<RewardResponseDTO> getRedeemableRewards(Integer customerId, String vehicleType, Integer userId);
 
@@ -94,3 +94,3 @@
      */
-    RedeemRewardResponseDTO redeemReward(Integer rewardId, RedeemRewardRequestDTO dto);
+    RedeemRewardResponseDTO redeemReward(Integer rewardId, RedeemRewardRequestDTO dto, Integer userId);
```

### File 2.7: `src/main/java/com/autowash/backend/reward/service/impl/RewardServiceImpl.java`
Inject `UserRepository` and `CustomerRepository`, add ownership verification helper, and call it.

**Apply this diff:**
```diff
@@ -38,2 +38,4 @@
     private final LoyaltyTransactionRepository loyaltyTransactionRepository;
+    private final com.autowash.backend.customer.repository.CustomerRepository customerRepository;
+    private final com.autowash.backend.user.repository.UserRepository userRepository;
 
@@ -107,3 +109,5 @@
     @Override
-    public List<RewardResponseDTO> getRedeemableRewards(Integer customerId, String vehicleType) {
+    public List<RewardResponseDTO> getRedeemableRewards(Integer customerId, String vehicleType, Integer userId) {
+        validateCustomerOwner(customerId, userId);
+
         Integer currentPoints = getCurrentPoints(customerId);
@@ -137,3 +141,5 @@
     @Override
     @Transactional
-    public RedeemRewardResponseDTO redeemReward(Integer rewardId, RedeemRewardRequestDTO dto) {
+    public RedeemRewardResponseDTO redeemReward(Integer rewardId, RedeemRewardRequestDTO dto, Integer userId) {
+        validateCustomerOwner(dto.customerId(), userId);
+
         Reward reward = findOrThrow(rewardId);
@@ -208,2 +214,29 @@
     }
+
+    private void validateCustomerOwner(Integer customerId, Integer userId) {
+        if (userId == null) {
+            throw new com.autowash.backend.common.exception.BusinessException(
+                    "Yêu cầu xác thực người dùng",
+                    org.springframework.http.HttpStatus.FORBIDDEN
+            );
+        }
+
+        com.autowash.backend.user.entity.User user = userRepository.findById(userId)
+                .orElseThrow(() -> new com.autowash.backend.common.exception.BusinessException(
+                        "Không tìm thấy tài khoản người dùng",
+                        org.springframework.http.HttpStatus.FORBIDDEN
+                ));
+
+        String role = user.getRole();
+        if ("admin".equalsIgnoreCase(role) || "staff".equalsIgnoreCase(role)) {
+            return;
+        }
+
+        com.autowash.backend.customer.entity.Customer authenticatedCustomer = customerRepository.findByUser_Id(userId)
+                .orElseThrow(() -> new com.autowash.backend.common.exception.BusinessException(
+                        "Không tìm thấy khách hàng ứng với tài khoản đăng nhập",
+                        org.springframework.http.HttpStatus.FORBIDDEN
+                ));
+
+        if (!authenticatedCustomer.getCustomerId().equals(customerId)) {
+            throw new com.autowash.backend.common.exception.BusinessException(
+                    "Bạn không có quyền thao tác với dữ liệu của khách hàng khác",
+                    org.springframework.http.HttpStatus.FORBIDDEN
+            );
+        }
+    }
```

---

## Task 3: User Enumeration Hardening (vuln-0003)

### File: `src/main/java/com/autowash/backend/auth/service/impl/AuthServiceImpl.java`
Consolidate register duplication errors into a single generic message.

**Apply this diff:**
```diff
@@ -101,11 +101,5 @@
 
-        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
-            throw new BusinessException("Email '" + normalizedEmail + "' da duoc su dung");
-        }
-
-        if (userRepository.existsByUsernameIgnoreCase(normalizedUsername)) {
-            throw new BusinessException("Tai khoan '" + request.getUsername() + "' da duoc su dung");
-        }
-
-        if (userRepository.existsByPhone(normalizedPhone)) {
-            throw new BusinessException("So dien thoai '" + normalizedPhone + "' da duoc su dung");
-        }
+        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)
+                || userRepository.existsByUsernameIgnoreCase(normalizedUsername)
+                || userRepository.existsByPhone(normalizedPhone)) {
+            throw new BusinessException("Thông tin đăng ký (email, tài khoản hoặc số điện thoại) đã được sử dụng");
+        }
```

---

## Task 4: Forgot Password Timing Side-Channel Mitigation (vuln-0004)

### File: `src/main/java/com/autowash/backend/auth/service/impl/AuthServiceImpl.java`
Increase timing delay range to match real SMTP execution times.

**Apply this diff:**
```diff
@@ -248,3 +248,3 @@
             long elapsed = System.currentTimeMillis() - startTime;
-            long targetDelay = 350 + secureRandom.nextInt(250); // 350ms - 600ms
+            long targetDelay = 1500 + secureRandom.nextInt(2000); // 1500ms - 3500ms
```

---

## Task 5: Promotion Usage TOCTOU Race Condition Mitigation (vuln-0005)

### File 5.1: `src/main/java/com/autowash/backend/promotion/repository/PromotionRepository.java`
Define `findByIdWithLock` with a pessimistic write lock.

**Apply this diff:**
```diff
@@ -53,2 +53,6 @@
     boolean existsByPromotionName(String promotionName);
+
+    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
+    @Query("SELECT p FROM Promotion p WHERE p.promotionId = :id")
+    java.util.Optional<Promotion> findByIdWithLock(@org.springframework.data.repository.query.Param("id") Integer id);
 }
```

### File 5.2: `src/main/java/com/autowash/backend/promotion/entity/PromotionUse.java`
Add a unique constraint on `(promotion_id, customer_id)` to the table.

**Apply this diff:**
```diff
@@ -9,3 +9,6 @@
 @Entity
-@Table(name = "promotion_use")
+@Table(
+    name = "promotion_use",
+    uniqueConstraints = @UniqueConstraint(columnNames = {"promotion_id", "customer_id"})
+)
 @Getter
```

### File 5.3: `src/main/java/com/autowash/backend/promotion/service/impl/PromotionServiceImpl.java`
Change `applyPromotion` to `@Transactional` (write mode) and retrieve using `findByIdWithLock`.

**Apply this diff:**
```diff
@@ -142,4 +142,4 @@
     @Override
-    @Transactional(readOnly = true)
+    @Transactional
     public PromotionApplyResponseDTO applyPromotion(PromotionApplyRequestDTO req) {
-        Promotion promotion = findOrThrow(req.getPromotionId());
+        Promotion promotion = promotionRepository.findByIdWithLock(req.getPromotionId())
+                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException(
+                        "Promotion không tồn tại: " + req.getPromotionId()));
```
