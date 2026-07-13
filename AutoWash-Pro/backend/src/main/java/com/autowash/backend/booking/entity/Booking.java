package com.autowash.backend.booking.entity;


import com.autowash.backend.booking.enums.BookingStatus;
import com.autowash.backend.branch.entity.Branch;
import com.autowash.backend.employee.entity.Employee;
import com.autowash.backend.timeslot.entity.TimeSlot;
import com.autowash.backend.customer.entity.Customer;
import com.autowash.backend.vehicle.entity.Vehicle;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

/**
 * FR-5: Vòng đời đặt chỗ — state machine:
 *
 *   pending ──────────────────────────────► cancelled
 *      │                                        ▲
 *      ▼                                        │
 *   confirmed ──────────────────────────────────┤
 *      │                                        │
 *      ├──────────────────────────────────► no_show
 *      │
 *      ▼
 *   in_progress
 *      │
 *      ▼
 *   completed
 *
 * FR-6: priorityScore xếp hạng waitlist.
 *        Platinum=4 > Gold=3 > Silver=2 > Member=1.
 *        Cùng score → sort bookingDate ASC (FIFO).
 *        Service set từ customer.tier.priorityLevel khi tạo.
 */
@Entity
@Table(name = "booking")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@ToString(exclude = {"customer", "vehicle", "slot", "branch", "assignedStaff"})  // cái cuối thay tên đẻ tránh trùng tên db cho rõ nghĩa


public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "booking_seq")
    @SequenceGenerator(name = "booking_seq", sequenceName = "booking_booking_id_seq", allocationSize = 1)
    @Column(name = "booking_id")
    @EqualsAndHashCode.Include
    private Integer bookingId;

    @NotNull(message = "Customer không được null")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_booking_customer"))
    private Customer customer;

    @NotNull(message = "Vehicle không được null")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_booking_vehicle"))
    private Vehicle vehicle;

    @NotNull(message = "Slot không được null")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "slot_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_booking_slot"))
    private TimeSlot slot;

    @NotNull(message = "Branch không được null")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "branch_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_booking_branch"))
    private Branch branch;

    // Nullable — chỉ set khi chuyển sang in_progress
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id",
            foreignKey = @ForeignKey(name = "fk_booking_employee"))
    private Employee assignedStaff;

    @NotBlank(message = "Booking code không được để trống")
    @Size(max = 30)
    @Column(name = "booking_code", nullable = false, unique = true, length = 30)
    private String bookingCode;

    @CreatedDate
    @Column(name = "booking_date", nullable = false, updatable = false)
    private LocalDateTime bookingDate;

    @NotNull(message = "Status không được null")
    @Column(name = "status", nullable = false, length = 15)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private BookingStatus status = BookingStatus.pending;

    /**
     * FR-6: Set từ customer.tier.priorityLevel khi tạo booking.
     * Dùng để sort waitlist khi slot mở lại sau cancel/no_show.
     */
    @Min(value = 1, message = "Priority score tối thiểu là 1")
    @Max(value = 4, message = "Priority score tối đa là 4")
    @Column(name = "priority_score", nullable = false)
    @Builder.Default
    private Integer priorityScore = 1;

    @Column(name = "start_time")
    private LocalDateTime startTime;

    @Column(name = "end_time")
    private LocalDateTime endTime;

    @Size(max = 255)
    @Column(name = "note", length = 255)
    private String note;

    @Column(name = "check_in_at")
    private LocalDateTime checkInAt;

    @Column(name = "completed_at")
    private LocalDateTime completeAt;

    @Column(name = "loyalty_point_granted", nullable = false)
    @Builder.Default
    private Boolean loyaltyPointGranted = false;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToOne(mappedBy = "booking", fetch = FetchType.LAZY)
    private com.autowash.backend.payment.entity.Payment payment;


    // ── FR-5 Helpers ─────────────────────────────────────────────────────────

    /** Cho phép huỷ ở pending hoặc confirmed. */
    public boolean isCancellable() {
        return BookingStatus.pending.equals(this.status)
                || BookingStatus.confirmed.equals(this.status);
    }

    /** Booking đang chiếm chỗ trong slot — dùng để check overlap. */
    public boolean isActive() {
        return this.status == BookingStatus.pending
                || this.status == BookingStatus.confirmed
                || this.status == BookingStatus.in_progress;
    }
}
