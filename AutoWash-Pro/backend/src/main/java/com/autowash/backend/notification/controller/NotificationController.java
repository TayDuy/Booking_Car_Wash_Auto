package com.autowash.backend.notification.controller;

import com.autowash.backend.common.dto.ApiResponse;
import com.autowash.backend.notification.dto.*;
import com.autowash.backend.notification.service.NotificationService;
import com.autowash.backend.notification.service.SseService;
import com.autowash.backend.user.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;

import com.autowash.backend.auth.service.SseTicketService;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final UserRepository userRepository;
    private final SseService sseService;
    private final SseTicketService sseTicketService;

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream(@RequestParam(name = "ticket") String ticket) {
        Integer userId = sseTicketService.consume(ticket);
        return sseService.register(userId);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<NotificationResponseDTO>> create(
            @Valid @RequestBody NotificationCreateDTO dto) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.created(notificationService.create(dto)));
    }

    @PostMapping("/bulk")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<BulkNotificationResponseDTO>> createBulk(
            @Valid @RequestBody BulkNotificationRequestDTO dto) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.created(notificationService.createBulk(dto)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<NotificationResponseDTO>>> getAll(
            @AuthenticationPrincipal UserDetails currentUser) {
        Integer userId = resolveUserId(currentUser);
        return ResponseEntity.ok(
                ApiResponse.success("Danh sách thông báo",
                        notificationService.getByUser(userId)));
    }

    @GetMapping("/unread")
    public ResponseEntity<ApiResponse<List<NotificationResponseDTO>>> getUnread(
            @AuthenticationPrincipal UserDetails currentUser) {
        Integer userId = resolveUserId(currentUser);
        return ResponseEntity.ok(
                ApiResponse.success("Thông báo chưa đọc",
                        notificationService.getUnreadByUser(userId)));
    }

    @GetMapping("/unread/count")
    public ResponseEntity<ApiResponse<UnreadCountResponseDTO>> countUnread(
            @AuthenticationPrincipal UserDetails currentUser) {
        Integer userId = resolveUserId(currentUser);
        return ResponseEntity.ok(
                ApiResponse.success(notificationService.countUnread(userId)));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(
            @PathVariable("id") Integer id,
            @AuthenticationPrincipal UserDetails currentUser) {
        Integer userId = resolveUserId(currentUser);
        notificationService.markAsRead(id, userId);
        return ResponseEntity.ok(
                ApiResponse.success("Đã đánh dấu đã đọc", null));
    }

    @PatchMapping("/read-all")
    public ResponseEntity<ApiResponse<Void>> markAllAsRead(
            @AuthenticationPrincipal UserDetails currentUser) {
        Integer userId = resolveUserId(currentUser);
        notificationService.markAllAsRead(userId);
        return ResponseEntity.ok(
                ApiResponse.success("Đã đánh dấu tất cả là đã đọc", null));
    }

    private Integer resolveUserId(UserDetails currentUser) {
        return userRepository.findByEmail(currentUser.getUsername())
                .orElseThrow(() -> new EntityNotFoundException(
                        "User không tồn tại: " + currentUser.getUsername()))
                .getId();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable("id") Integer id,
            @AuthenticationPrincipal UserDetails currentUser) {
        Integer userId = resolveUserId(currentUser);
        notificationService.delete(id, userId);
        return ResponseEntity.ok(ApiResponse.success("Đã xóa thông báo", null));
    }

    @DeleteMapping
    public ResponseEntity<ApiResponse<Void>> deleteAll(
            @AuthenticationPrincipal UserDetails currentUser) {
        Integer userId = resolveUserId(currentUser);
        notificationService.deleteAll(userId);
        return ResponseEntity.ok(ApiResponse.success("Đã xóa tất cả thông báo", null));
    }

    @DeleteMapping("/admin/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> adminRevoke(@PathVariable("id") Integer id) {
        notificationService.adminRevoke(id);
        return ResponseEntity.ok(ApiResponse.success("Đã thu hồi thông báo", null));
    }
}