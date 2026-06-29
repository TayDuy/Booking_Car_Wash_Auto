package com.autowash.backend.branch.entity;

import com.autowash.backend.booking.entity.Booking;
import com.autowash.backend.employee.entity.Employee;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;


import java.time.LocalDateTime;
import java.util.List;

/**
 * Chi nhánh rửa xe.
 * Mỗi Booking và TimeSlot đều thuộc về một Branch cụ thể.
 */
@Entity
@Table(name = "branch")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@ToString(exclude = {"staffList", "bookings"})
public class Branch {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "branch_id")
    @EqualsAndHashCode.Include
    private Integer branchId;

    @NotBlank(message = "Tên chi nhánh không được để trống")
    @Size(max = 100)
    @Column(name = "branch_name", nullable = false, unique = true, length = 100)
    private String branchName;

    @NotBlank(message = "Địa chỉ không được để trống")
    @Size(max = 255)
    @Column(name = "address", nullable = false, length = 255)
    private String address;

    @NotBlank(message = "Số điện thoại không được để trống")
    @Size(max = 15)
    @Column(name = "phone", nullable = false, length = 15)
    private String phone;

    /**
     * Số slot tối đa có thể phục vụ đồng thời.
     * Dùng để kiểm soát capacity khi tạo TimeSlot.
     */
    @Min(value = 1, message = "Capacity tối thiểu là 1")
    @Column(name = "capacity", nullable = false)
    @Builder.Default
    private Integer capacity = 1;

    @NotNull(message = "Status không được null")
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private BranchStatus status = BranchStatus.active;

    @OneToMany(mappedBy = "branch", fetch = FetchType.LAZY)
    private List<Employee> staffList;

    @OneToMany(mappedBy = "branch", fetch = FetchType.LAZY)
    private List<Booking> bookings;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum BranchStatus {
        active, inactive
    }

    /** Chi nhánh có nhận booking mới không. */
    public boolean isAcceptingBookings() {
        return BranchStatus.active.equals(this.status);
    }
}