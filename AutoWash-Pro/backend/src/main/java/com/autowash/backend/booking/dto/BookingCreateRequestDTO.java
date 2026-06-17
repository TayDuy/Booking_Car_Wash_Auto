package com.autowash.backend.booking.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.*;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingCreateRequestDTO {
    @NotNull(message = "Customer ID không được null")
    private Integer customerId;

    @NotNull(message = "Vehicle ID không được null")
    private Integer vehicleId;

    @NotNull(message = "Slot ID không được null")
    private Integer slotId;

    @NotNull(message = "Branch ID không được null")
    private Integer branchId;

    @Size(max = 255)
    private String note;

    @NotEmpty(message = "Phải chọn ít nhất 1 dịch vụ")
    @Valid
    private List<BookingDetailItem> details;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class BookingDetailItem {
        @NotNull(message = "Service ID không được null")
        private Integer serviceId;

        @NotNull(message = "Quantity không được null")
        @Min(value = 1, message = "Quantity tối thiểu là 1")
        private Integer quantity;
    }
}