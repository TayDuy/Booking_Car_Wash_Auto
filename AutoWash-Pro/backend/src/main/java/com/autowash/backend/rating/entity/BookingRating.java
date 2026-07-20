package com.autowash.backend.rating.entity;

import com.autowash.backend.booking.entity.Booking;
import com.autowash.backend.customer.entity.Customer;
import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "booking_rating")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@ToString(exclude = {"booking", "customer"})
public class BookingRating {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "rating_id")
    @EqualsAndHashCode.Include
    private Integer ratingId;

    @NotNull(message = "Booking không được null")
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", nullable = false, unique = true,
            foreignKey = @ForeignKey(name = "fk_rating_booking"))
    private Booking booking;

    @NotNull(message = "Customer không được null")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_rating_customer"))
    private Customer customer;

    @NotNull(message = "Số sao đánh giá không được null")
    @Min(value = 1, message = "Số sao tối thiểu là 1")
    @Max(value = 5, message = "Số sao tối đa là 5")
    @Column(name = "rating_stars", nullable = false)
    private Integer ratingStars;

    @Size(max = 500, message = "Nhận xét tối đa 500 ký tự")
    @Column(name = "comment", length = 500)
    private String comment;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
