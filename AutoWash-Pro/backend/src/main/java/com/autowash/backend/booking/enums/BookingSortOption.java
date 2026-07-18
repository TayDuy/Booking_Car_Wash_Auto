package com.autowash.backend.booking.enums;

/**
 * Kiểu sắp xếp cho danh sách booking (Admin - Manage Bookings).
 *
 * NEWEST   : mới đặt trước (bookingDate DESC).
 * PRIORITY : theo thứ hạng khách hàng trước, cùng hạng thì ai đặt
 *            trước xếp trước (priorityScore DESC, bookingDate ASC).
 */
public enum BookingSortOption {
    NEWEST,
    PRIORITY;

    /**
     * Parse an toàn từ query param, giá trị không hợp lệ hoặc null
     * sẽ fallback về NEWEST.
     */
    public static BookingSortOption fromParam(String raw) {
        if (raw == null || raw.isBlank()) {
            return NEWEST;
        }
        try {
            return BookingSortOption.valueOf(raw.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            return NEWEST;
        }
    }
}