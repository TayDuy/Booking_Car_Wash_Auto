package com.autowash.backend.booking.enums;

/**
 * Tách ra khỏi entity để DTO không cần import entity.
 * Dùng chung cho cả BookingResponseDTO và BookingCreateResponseDTO.
 */

/**
 * Vòng đời của một booking:
 *
 * pending
 * → confirmed
 * → checked_in
 * → in_progress
 * → completed
 *
 * Các nhánh kết thúc khác:
 * - pending/confirmed → cancelled
 * - confirmed → no_show
 */
public enum BookingStatus {

    /**
     * Khách vừa đặt lịch, đang chờ chi nhánh xác nhận.
     */
    pending,

    /**
     * Chi nhánh đã xác nhận lịch.
     */
    confirmed,

    /**
     * Khách và xe đã có mặt tại chi nhánh.
     */
    checked_in,

    /**
     * Xe đang được nhân viên thực hiện dịch vụ.
     */
    in_progress,

    /**
     * Dịch vụ đã hoàn thành, xe sẵn sàng bàn giao.
     */
    completed,

    /**
     * Booking đã bị hủy.
     */
    cancelled,

    /**
     * Khách không đến theo lịch.
     */
    no_show
}