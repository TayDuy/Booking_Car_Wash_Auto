package com.autowash.backend.promotion.controller;

import com.autowash.backend.promotion.dto.PromotionApplyRequestDTO;
import com.autowash.backend.promotion.dto.PromotionApplyResponseDTO;
import com.autowash.backend.promotion.dto.PromotionRequestDTO;
import com.autowash.backend.promotion.dto.PromotionResponseDTO;
import com.autowash.backend.promotion.entity.Promotion;
import com.autowash.backend.promotion.service.PromotionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/promotions")
@RequiredArgsConstructor
public class PromotionController {

    private final PromotionService promotionService;

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<PromotionResponseDTO> create(
            @Valid @RequestBody PromotionRequestDTO dto,
            @AuthenticationPrincipal UserDetails currentUser) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(promotionService.create(dto, currentUser.getUsername()));
    }

    @GetMapping
    public ResponseEntity<List<PromotionResponseDTO>> getAll(
            @RequestParam(required = false, name = "status") Promotion.PromotionStatus status,
            @RequestParam(required = false, name = "vehicleType") Promotion.VehicleType vehicleType,
            @RequestParam(required = false, name = "discountType") Promotion.DiscountType discountType,
            @RequestParam(required = false, name = "date")
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(
                promotionService.getAll(status, vehicleType, discountType, date));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PromotionResponseDTO> getById(@PathVariable("id") Integer id) {
        return ResponseEntity.ok(promotionService.getById(id));
    }

    @GetMapping("/active")
    public ResponseEntity<List<PromotionResponseDTO>> getAllActive() {
        return ResponseEntity.ok(promotionService.getAllActive());
    }

    @PreAuthorize("hasRole('CUSTOMER')")
    @PostMapping("/apply")
    public ResponseEntity<PromotionApplyResponseDTO> applyPromotion(
            @Valid @RequestBody PromotionApplyRequestDTO req) {
        return ResponseEntity.ok(promotionService.applyPromotion(req));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<PromotionResponseDTO> update(
            @PathVariable("id") Integer id,
            @Valid @RequestBody PromotionRequestDTO dto) {
        return ResponseEntity.ok(promotionService.update(id, dto));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deactivate(@PathVariable("id") Integer id) {
        promotionService.deactivate(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/expire-expired")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> expireExpiredPromotions() {
        int expiredCount = promotionService.expireExpiredPromotions();

        return ResponseEntity.ok(
                "Expired promotions updated: " + expiredCount
        );
    }
}