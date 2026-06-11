package com.autowash.backend.employee.entity;

import com.autowash.backend.booking.entity.Booking;
import com.autowash.backend.branch.entity.Branch;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Nhân viên thực hiện dịch vụ rửa xe.
 * Được gán vào Booking khi chuyển sang trạng thái in_progress.
 */
@Entity
@Table(name = "employee")
@EntityListeners(AbstractMethodError.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@ToString(exclude = {"branch", "bookings"})
public class Employee {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Integer employeeId;                                     // đổi staffId → employeeId cho khớp DB (employee_id)

    @NotNull(message = "Branch không được null")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "branch_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_employee_branch"))  // đổi tên FK cho khớp DB
    private Branch branch;

    @NotBlank(message = "Tên nhân viên không được để trống")
    @Size(max = 100)
    @Column(name = "full_name", nullable = false, length = 100)
    private String fullName;

    // Nullable trong DB — không @NotBlank, không nullable = false
    @Size(max = 15)
    @Column(name = "phone", unique = true, length = 15)
    private String phone;

    // Nullable trong DB
    @Size(max = 100)
    @Email(message = "Email không hợp lệ")
    @Column(name = "email", unique = true, length = 100)
    private String email;

    @NotNull(message = "Position không được null")
    @Enumerated(EnumType.STRING)
    @Column(name = "position", nullable = false, length = 10)
    @Builder.Default
    private EmployeePosition position = EmployeePosition.staff;     // thêm position cho khớp DB

    @NotNull(message = "Role không được null")
    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false, length = 15)
    @Builder.Default
    private StaffRole role = StaffRole.washer;

    @NotNull(message = "Status không được null")
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 10)
    @Builder.Default
    private StaffStatus status = StaffStatus.active;

    @OneToMany(mappedBy = "assignedStaff", fetch = FetchType.LAZY)
    private List<Booking> bookings;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum EmployeePosition {
        staff, manager, admin
    }

    public enum StaffRole {
        washer, supervisor, manager
    }

    /**
     * DB chỉ có active/inactive — bỏ on_leave để khớp CHECK constraint.
     * Nếu cần on_leave thì phải ALTER TABLE thêm vào DB trước.
     */
    public enum StaffStatus {
        active, inactive
    }

    /** Nhân viên có thể được phân công booking không. */
    public boolean isAssignable() {
        return StaffStatus.active.equals(this.status);
    }
}