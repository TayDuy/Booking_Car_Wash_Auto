package com.autowash.backend.refund.controller;

import com.autowash.backend.refund.dto.RefundCompleteRequestDTO;
import com.autowash.backend.refund.dto.RefundCreateRequestDTO;
import com.autowash.backend.refund.dto.RefundDecisionDTO;
import com.autowash.backend.refund.dto.RefundLookupResponseDTO;
import com.autowash.backend.refund.dto.RefundResponseDTO;
import com.autowash.backend.refund.dto.RefundSelfRequestDTO;
import com.autowash.backend.refund.entity.Refund.RefundStatus;
import com.autowash.backend.refund.service.RefundService;
import com.autowash.backend.security.CustomUserDetails;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/refunds")
@RequiredArgsConstructor
public class RefundController {

    private final RefundService refundService;

    // ========================== STAFF / ADMIN ==========================

    @PreAuthorize("hasAnyRole('EMPLOYEE','ADMIN')")
    @GetMapping("/lookup")
    public ResponseEntity<RefundLookupResponseDTO> lookup(@RequestParam("bookingCode") String bookingCode) {
        return ResponseEntity.ok(refundService.lookupByBookingCode(bookingCode));
    }

    @PreAuthorize("hasAnyRole('EMPLOYEE','ADMIN')")
    @PostMapping
    public ResponseEntity<RefundResponseDTO> create(
            @Valid @RequestBody RefundCreateRequestDTO request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(refundService.create(request, userDetails.getId()));
    }

    @PreAuthorize("hasAnyRole('EMPLOYEE','ADMIN')")
    @GetMapping("/{id}")
    public ResponseEntity<RefundResponseDTO> getById(@PathVariable("id") Integer id) {
        return ResponseEntity.ok(refundService.getById(id));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public ResponseEntity<List<RefundResponseDTO>> getAll(
            @RequestParam(required = false) RefundStatus status) {
        return ResponseEntity.ok(refundService.getAll(status));
    }

    @PreAuthorize("hasAnyRole('EMPLOYEE','ADMIN')")
    @GetMapping("/mine")
    public ResponseEntity<List<RefundResponseDTO>> getMine(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(refundService.getMine(userDetails.getId()));
    }

    // ========================== CUSTOMER SELF-SERVICE ==========================

    @PreAuthorize("hasRole('CUSTOMER')")
    @PostMapping("/my")
    public ResponseEntity<RefundResponseDTO> createMine(
            @Valid @RequestBody RefundSelfRequestDTO request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(refundService.createSelfRequest(request, userDetails.getId()));
    }

    @PreAuthorize("hasRole('CUSTOMER')")
    @GetMapping("/my")
    public ResponseEntity<List<RefundResponseDTO>> getMyRefunds(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(refundService.getMyCustomerRefunds(userDetails.getId()));
    }

    // ========================== ADMIN WORKFLOW ==========================

    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/{id}/processing")
    public ResponseEntity<RefundResponseDTO> markProcessing(
            @PathVariable("id") Integer id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(refundService.markProcessing(id, userDetails.getId()));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/{id}/approve")
    public ResponseEntity<RefundResponseDTO> approve(
            @PathVariable("id") Integer id,
            @RequestBody(required = false) RefundDecisionDTO decision,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(refundService.approve(id, decision, userDetails.getId()));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/{id}/reject")
    public ResponseEntity<RefundResponseDTO> reject(
            @PathVariable("id") Integer id,
            @Valid @RequestBody RefundDecisionDTO decision,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(refundService.reject(id, decision, userDetails.getId()));
    }

    @PreAuthorize("hasAnyRole('EMPLOYEE','ADMIN')")
    @PatchMapping("/{id}/complete")
    public ResponseEntity<RefundResponseDTO> complete(
            @PathVariable("id") Integer id,
            @RequestBody(required = false) RefundCompleteRequestDTO request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(refundService.complete(id, request, userDetails.getId()));
    }
}