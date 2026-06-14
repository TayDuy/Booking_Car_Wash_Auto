package com.autowash.backend.booking.dto;

import com.autowash.backend.booking.enums.BookingStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DTO trả về ngay sau khi tạo booking thành công.
 * Gọn hơn BookingResponseDTO — chỉ chứa thông tin cần thiết
 * để client xác nhận booking đã được tạo.
 * Logic tính totalAmount được chuyển vào BookingMapper.
 */
@Getter
@Builder
public class BookingCreateResponseDTO {

    /** ID và mã định danh của booking vừa tạo. */
    private Integer bookingId;
    private String bookingCode;

    /** Thời điểm tạo booking. */
    private LocalDateTime bookingDate;

    /** Trạng thái ban đầu — luôn là pending khi mới tạo. */
    private BookingStatus status;

    /** Tổng tiền = sum(subTotal) của tất cả BookingDetail. */
    private BigDecimal totalAmount;

    /** Thông báo xác nhận cho client. */
    private String message;
}