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

/**
 * REST Controller cho Notification (FR-12).
 *
 * <p>Base path: {@code /api/v1/notifications}</p>
 *
 * <p>Phân quyền:
 * <ul>
 *   <li>POST (create / bulk) → chỉ ADMIN</li>
 *   <li>GET / PATCH / SSE    → USER đang đăng nhập</li>
 * </ul>
 * userId luôn lấy từ JWT — client không tự truyền userId.</p>
 */
import com.autowash.backend.auth.service.SseTicketService;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final UserRepository userRepository;
    private final SseService sseService;
    private final SseTicketService sseTicketService;

    // ── SSE STREAM ────────────────────────────────────────────────────────────

    /**
     * User subscribe để nhận notification real-time qua SSE.
     * Client giữ kết nối này mở — server đẩy xuống khi có thông báo mới.
     *
     * <p>{@code GET /api/v1/notifications/stream}</p>
     */
    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream(@RequestParam String ticket) {
        Integer userId = sseTicketService.consume(ticket);
        return sseService.register(userId); // đăng ký kết nối, trả về emitter
    }

    // ── ADMIN: CREATE ─────────────────────────────────────────────────────────

    /**
     * Admin tạo thủ công một notification gửi đến user cụ thể.
     *
     * <p>{@code POST /api/v1/notifications}</p>
     *
     * @param dto thông tin notification và userId nhận
     * @return HTTP 201 kèm notification vừa tạo
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<NotificationResponseDTO>> create(
            @Valid @RequestBody NotificationCreateDTO dto) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.created(notificationService.create(dto)));
    }

    /**
     * Admin gửi thông báo hàng loạt đến nhiều user.
     * Nếu userIds không truyền → broadcast tất cả user active.
     *
     * <p>{@code POST /api/v1/notifications/bulk}</p>
     *
     * @param dto thông tin notification và danh sách userId nhận
     * @return HTTP 201 kèm số lượng đã gửi
     */
    @PostMapping("/bulk")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<BulkNotificationResponseDTO>> createBulk(
            @Valid @RequestBody BulkNotificationRequestDTO dto) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.created(notificationService.createBulk(dto)));
    }

    // ── USER: READ ────────────────────────────────────────────────────────────

    /**
     * Lấy tất cả notification của user đang đăng nhập, mới nhất trước.
     *
     * <p>{@code GET /api/v1/notifications}</p>
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<NotificationResponseDTO>>> getAll(
            @AuthenticationPrincipal UserDetails currentUser) {
        Integer userId = resolveUserId(currentUser);
        return ResponseEntity.ok(
                ApiResponse.success("Danh sách thông báo",
                        notificationService.getByUser(userId)));
    }

    /**
     * Lấy danh sách notification chưa đọc của user đang đăng nhập.
     *
     * <p>{@code GET /api/v1/notifications/unread}</p>
     */
    @GetMapping("/unread")
    public ResponseEntity<ApiResponse<List<NotificationResponseDTO>>> getUnread(
            @AuthenticationPrincipal UserDetails currentUser) {
        Integer userId = resolveUserId(currentUser);
        return ResponseEntity.ok(
                ApiResponse.success("Thông báo chưa đọc",
                        notificationService.getUnreadByUser(userId)));
    }

    /**
     * Đếm số notification chưa đọc — dùng cho badge icon thông báo.
     *
     * <p>{@code GET /api/v1/notifications/unread/count}</p>
     */
    @GetMapping("/unread/count")
    public ResponseEntity<ApiResponse<UnreadCountResponseDTO>> countUnread(
            @AuthenticationPrincipal UserDetails currentUser) {
        Integer userId = resolveUserId(currentUser);
        return ResponseEntity.ok(
                ApiResponse.success(notificationService.countUnread(userId)));
    }

    // ── USER: ACTION ──────────────────────────────────────────────────────────

    /**
     * Đánh dấu một notification cụ thể là đã đọc.
     * Service kiểm tra ownership — chỉ đúng chủ mới được mark.
     *
     * <p>{@code PATCH /api/v1/notifications/{id}/read}</p>
     *
     * @param id primary key của notification cần đánh dấu
     */
    @PatchMapping("/{id}/read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(
            @PathVariable Integer id,
            @AuthenticationPrincipal UserDetails currentUser) {
        Integer userId = resolveUserId(currentUser);
        notificationService.markAsRead(id, userId);
        return ResponseEntity.ok(
                ApiResponse.success("Đã đánh dấu đã đọc", null));
    }

    /**
     * Đánh dấu tất cả notification của user là đã đọc.
     * Dùng khi user nhấn "Mark all as read" trên UI.
     *
     * <p>{@code PATCH /api/v1/notifications/read-all}</p>
     */
    @PatchMapping("/read-all")
    public ResponseEntity<ApiResponse<Void>> markAllAsRead(
            @AuthenticationPrincipal UserDetails currentUser) {
        Integer userId = resolveUserId(currentUser);
        notificationService.markAllAsRead(userId);
        return ResponseEntity.ok(
                ApiResponse.success("Đã đánh dấu tất cả là đã đọc", null));
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    /**
     * Resolve email từ JWT → userId trong DB.
     *
     * <p>username trong {@link UserDetails} = email
     * (theo cấu hình {@code JwtAuthenticationFilter}).</p>
     *
     * @param currentUser principal inject từ Spring Security
     * @return userId tương ứng với email trong JWT
     * @throws EntityNotFoundException nếu email không tồn tại trong DB
     */
    private Integer resolveUserId(UserDetails currentUser) {
        return userRepository.findByEmail(currentUser.getUsername())
                .orElseThrow(() -> new EntityNotFoundException(
                        "User không tồn tại: " + currentUser.getUsername()))
                .getId();
    }
}