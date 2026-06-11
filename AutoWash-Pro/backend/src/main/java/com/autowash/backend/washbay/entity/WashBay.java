package com.autowash.backend.washbay.entity;

import com.autowash.backend.branch.entity.Branch;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

/**
 * FR-4: TimeSlot join WashBay để trả thông tin bay cho client
 *        (tên bay, trạng thái vật lý — khác với SlotStatus của TimeSlot).
 */
@Entity
@Table(name = "wash_bay")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@ToString(exclude = "branch")
public class WashBay {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "bay_id")
    @EqualsAndHashCode.Include
    private Integer bayId;

    @NotNull(message = "Branch không được null")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "branch_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_washbay_branch"))
    private Branch branch;

    @NotBlank(message = "Tên bay không được để trống")
    @Size(max = 50, message = "Tên bay tối đa 50 ký tự")
    @Column(name = "bay_name", length = 50)
    private String bayName;

    @NotNull(message = "Status không được null")
    @Column(name = "status", nullable = false, length = 15)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private BayStatus status = BayStatus.available;

    @Min(value = 1, message = "Capacity tối thiểu là 1")
    @Column(name = "capacity", nullable = false)
    @Builder.Default
    private Integer capacity = 1;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum BayStatus { available, occupied, maintenance }
}