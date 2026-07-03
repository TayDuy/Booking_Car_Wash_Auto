package com.autowash.backend.timeslot.controller;

import com.autowash.backend.timeslot.dto.GenerateSlotsRequestDTO;
import com.autowash.backend.timeslot.dto.GenerateSlotsResponseDTO;
import com.autowash.backend.timeslot.dto.TimeSlotRequestDTO;
import com.autowash.backend.timeslot.dto.TimeSlotResponseDTO;
import com.autowash.backend.timeslot.entity.TimeSlot.SlotStatus;
import com.autowash.backend.timeslot.service.TimeSlotService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

/**
 * REST controller cho Time Slot.
 * Base path: /api/v1/time-slots
 *
 * Phân quyền:
 *  - GET /available         → authenticated (CUSTOMER, STAFF, ADMIN) — khách chọn giờ
 *  - GET (list), GET /{id}  → STAFF, ADMIN
 *  - POST, PUT, DELETE      → STAFF, ADMIN
 *  - PATCH /{id}/status     → STAFF, ADMIN
 */
@RestController
@RequestMapping("/api/v1/time-slots")
@RequiredArgsConstructor
public class TimeSlotController {

    private final TimeSlotService service;

    /**
     * GET /api/v1/time-slots/available?branchId=1&date=2026-06-20
     * FR-4: Khách hàng dùng để xem khung giờ còn trống.
     */
    @GetMapping("/available")
    public ResponseEntity<List<TimeSlotResponseDTO>> getAvailable(
            @RequestParam Integer branchId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(service.getAvailable(branchId, date));
    }

    /**
     * GET /api/v1/time-slots?branchId=1&date=2026-06-20
     * Admin/Staff xem toàn bộ slot trong ngày của một branch.
     * Customer cũng cần gọi endpoint này ở trang đặt lịch để thấy được
     * cả các khung giờ đã hết chỗ (status FULL) thay vì chúng biến mất
     * hoàn toàn — xem comment trong BookingPage.jsx (FE). Đây là API chỉ đọc
     * (read-only) nên việc mở thêm quyền CUSTOMER là an toàn.
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('CUSTOMER', 'STAFF', 'ADMIN')")
    public ResponseEntity<List<TimeSlotResponseDTO>> getByBranchAndDate(
            @RequestParam Integer branchId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(service.getByBranchAndDate(branchId, date));
    }

    /**
     * GET /api/v1/time-slots/{id}
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<TimeSlotResponseDTO> getById(@PathVariable Integer id) {
        return ResponseEntity.ok(service.getById(id));
    }

    /**
     * POST /api/v1/time-slots
     * Admin tạo slot mới cho một bay trong một ngày cụ thể.
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<TimeSlotResponseDTO> create(
            @Valid @RequestBody TimeSlotRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request));
    }

    /**
     * PUT /api/v1/time-slots/{id}
     * Admin cập nhật slot (đổi giờ, sức chứa...).
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<TimeSlotResponseDTO> update(
            @PathVariable Integer id,
            @Valid @RequestBody TimeSlotRequestDTO request) {
        return ResponseEntity.ok(service.update(id, request));
    }

    /**
     * PATCH /api/v1/time-slots/{id}/status?value=closed
     * Admin đóng/mở slot nhanh mà không cần truyền toàn bộ body.
     */
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<TimeSlotResponseDTO> changeStatus(
            @PathVariable Integer id,
            @RequestParam SlotStatus value) {
        return ResponseEntity.ok(service.changeStatus(id, value));
    }

    /**
     * DELETE /api/v1/time-slots/{id}
     * Chỉ xóa được slot chưa có booking nào — service sẽ throw nếu vi phạm.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/generate")
    public ResponseEntity<GenerateSlotsResponseDTO> generateMonthlySlots(
            @Valid @RequestBody GenerateSlotsRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.generateMonthlySlots(request));
    }

}