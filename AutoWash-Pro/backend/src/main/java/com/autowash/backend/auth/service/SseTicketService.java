package com.autowash.backend.auth.service;

public interface SseTicketService {
    /**
     * Tạo một vé ticket kết nối SSE mới dựa trên userId.
     */
    String createTicket(Integer userId);

    /**
     * Xác thực và sử dụng vé ticket kết nối SSE, trả về userId tương ứng.
     * Vé sẽ bị hủy ngay lập tức sau khi dùng (single-use).
     */
    Integer consume(String ticket);
}
