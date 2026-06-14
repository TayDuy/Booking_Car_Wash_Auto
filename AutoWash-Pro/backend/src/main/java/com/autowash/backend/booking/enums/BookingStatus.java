package com.autowash.backend.booking.enums;

/**
 * Tách ra khỏi entity để DTO không cần import entity.
 * Dùng chung cho cả BookingResponseDTO và BookingCreateResponseDTO.
 */
public enum BookingStatus {
    pending, confirmed, in_progress, completed, cancelled, no_show
}