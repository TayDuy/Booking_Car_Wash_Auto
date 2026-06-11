package com.autowash.backend.booking.entity;


import com.autowash.backend.servicepackage.entity.ServicePackage;
import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

/**
 * FR-5: Chi tiết dịch vụ trong booking.
 *
 * unitPrice là snapshot giá tại thời điểm đặt —
 * tách khỏi service_package.base_price để admin thay đổi giá sau
 * không ảnh hưởng các booking cũ đã tạo.
 */
@Entity
@Table(name = "booking_detail")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@ToString(exclude = {"booking", "service"})
public class BookingDetail {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "booking_detail_id")
    @EqualsAndHashCode.Include
    private Integer bookingDetailId;

    @NotNull(message = "Booking không được null")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_bookingdetail_booking"))
    private Booking booking;

    @NotNull(message = "Service không được null")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "service_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_bookingdetail_service"))
    private ServicePackage service;

    @Min(value = 1, message = "Quantity tối thiểu là 1")
    @Column(name = "quantity", nullable = false)
    @Builder.Default
    private Integer quantity = 1;

    /** Snapshot giá lúc đặt — không đổi dù base_price thay đổi sau này. */
    @NotNull(message = "Đơn giá không được null")
    @DecimalMin(value = "0.0", inclusive = false, message = "Đơn giá phải lớn hơn 0")
    @Digits(integer = 10, fraction = 2)
    @Column(name = "unit_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal unitPrice;

    @NotNull(message = "Sub total không được null")
    @DecimalMin(value = "0.0", inclusive = false, message = "Sub total phải lớn hơn 0")
    @Digits(integer = 10, fraction = 2)
    @Column(name = "sub_total", nullable = false, precision = 12, scale = 2)
    private BigDecimal subTotal;
}
