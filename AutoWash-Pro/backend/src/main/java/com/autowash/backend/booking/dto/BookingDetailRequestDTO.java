package com.autowash.backend.booking.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

/**
 * DTO dùng để client gửi yêu cầu thêm hoặc cập nhật
 * một dòng dịch vụ (BookingDetail) trong Booking.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingDetailRequestDTO {

    // ID của gói dịch vụ cần thêm vào
    @NotNull(message = "Service ID không được null")
    private Integer serviceId;

    // Số lượng dịch vụ (ví dụ: rửa 2 xe cùng lúc)
    @Min(value = 1, message = "Quantity tối thiểu là 1")
    private Integer quantity;

    // Ghi chú riêng cho dòng dịch vụ này (nếu có)
    @Size(max = 255, message = "Ghi chú tối đa 255 ký tự")
    private String note;
}