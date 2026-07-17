package com.autowash.backend.employee.entity;

import com.autowash.backend.booking.entity.Booking;
import com.autowash.backend.branch.entity.Branch;
import com.autowash.backend.user.entity.User;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Nhân viên thực hiện và quản lý dịch vụ rửa xe.
 *
 * Mỗi Employee:
 * - Liên kết với đúng một tài khoản đăng nhập.
 * - Thuộc đúng một chi nhánh.
 * - Chỉ được phân công booking khi đang active.
 */
@Entity
@Table(
        name = "employee",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uq_employee_user",
                        columnNames = "user_id"
                )
        }
)
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@ToString(exclude = {"user", "branch", "bookings"})
public class Employee {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "employee_id")
    @EqualsAndHashCode.Include
    private Integer employeeId;

    /**
     * Tài khoản dùng để đăng nhập.
     *
     * JWT trả về userId, sau đó dùng quan hệ này để tìm Employee,
     * thay vì đối chiếu email giữa hai bảng.
     */
    @NotNull(message = "Tài khoản nhân viên không được null")
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "user_id",
            nullable = false,
            unique = true,
            foreignKey = @ForeignKey(name = "fk_employee_account")
    )
    private User user;

    /**
     * Chi nhánh mà nhân viên đang làm việc.
     */
    @NotNull(message = "Branch không được null")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "branch_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_employee_branch")
    )
    private Branch branch;

    @NotBlank(message = "Tên nhân viên không được để trống")
    @Size(max = 100, message = "Tên nhân viên tối đa 100 ký tự")
    @Column(name = "full_name", nullable = false, length = 100)
    private String fullName;

    @Size(max = 15, message = "Số điện thoại tối đa 15 ký tự")
    @Column(name = "phone", unique = true, length = 15)
    private String phone;

    @Size(max = 100, message = "Email tối đa 100 ký tự")
    @Email(message = "Email không hợp lệ")
    @Column(name = "email", unique = true, length = 100)
    private String email;

    /**
     * Chức vụ trong hệ thống nội bộ.
     */
    @NotNull(message = "Position không được null")
    @Enumerated(EnumType.STRING)
    @Column(name = "position", nullable = false, length = 10)
    @Builder.Default
    private EmployeePosition position = EmployeePosition.staff;

    /**
     * Vai trò vận hành tại trạm rửa xe.
     */
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

    /**
     * Các booking đã được phân công cho nhân viên này.
     */
    @OneToMany(mappedBy = "assignedStaff", fetch = FetchType.LAZY)
    @Builder.Default
    private List<Booking> bookings = new java.util.ArrayList<>();

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum EmployeePosition {
        staff,
        manager,
        admin
    }

    public enum StaffRole {
        washer,
        supervisor,
        manager
    }

    public enum StaffStatus {
        active,
        inactive
    }

    /**
     * Nhân viên có thể được phân công booking hay không.
     */
    public boolean isAssignable() {
        return StaffStatus.active.equals(this.status);
    }

    /**
     * Kiểm tra nhân viên có thuộc chi nhánh được truyền vào hay không.
     */
    public boolean belongsToBranch(Integer branchId) {
        return branchId != null
                && this.branch != null
                && branchId.equals(this.branch.getBranchId());
    }

    /**
     * Kiểm tra nhân viên có quyền giám sát hàng chờ hay không.
     */
    public boolean canManageQueue() {
        return StaffRole.supervisor.equals(this.role)
                || StaffRole.manager.equals(this.role);
    }
}