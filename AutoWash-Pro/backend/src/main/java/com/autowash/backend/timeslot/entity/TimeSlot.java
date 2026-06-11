package com.autowash.backend.timeslot.entity;

import com.autowash.backend.branch.entity.Branch;
import com.autowash.backend.washbay.entity.WashBay;
import jakarta.persistence.*;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

/**
 * FR-4: Khung giờ có thể đặt tại một bay cụ thể.
 * FR-6: Quản lý sức chứa — tránh overbooking bằng optimistic locking.
 *
 * @Version trên currentBookings = optimistic locking:
 *   Khi 2 request đồng thời book cùng slot, transaction thứ 2 nhận
 *   OptimisticLockException → service bắt và trả "slot đã đầy",
 *   không cần PESSIMISTIC lock toàn table.
 */
@Entity
@Table(name = "time_slot",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_slot_bay_date_start",
                columnNames = {"bay_id", "slot_date", "start_time"}  // mỗi bay chỉ có 1 slot tại cùng thời điểm
        )
)
@EntityListeners(AuditingEntityListener.class)  // bật JPA Auditing cho createdAt/updatedAt
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@ToString(exclude = {"branch", "washBay"})  // tránh vòng lặp khi log
public class TimeSlot {

        @Id
        @GeneratedValue(strategy = GenerationType.IDENTITY)
        @Column(name = "slot_id")
        @EqualsAndHashCode.Include
        private Integer slotId;

        /** Chi nhánh chứa slot này — dùng để filter slot theo branch (FR-4). */
        @NotNull(message = "Branch không được null")
        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "branch_id", nullable = false,
                foreignKey = @ForeignKey(name = "fk_timeslot_branch"))
        private Branch branch;

        /** Bay vật lý thực hiện dịch vụ — mỗi slot gắn với 1 bay cụ thể. */
        @NotNull(message = "WashBay không được null")
        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "bay_id", nullable = false,
                foreignKey = @ForeignKey(name = "fk_timeslot_bay"))
        private WashBay washBay;

        /** Ngày của slot — dùng @Column, không phải @JoinColumn vì đây là giá trị thường, không phải FK. */
        @NotNull(message = "Ngày không được null")
        @FutureOrPresent(message = "Ngày slot phải là hôm nay hoặc tương lai")
        @Column(name = "slot_date", nullable = false)
        private LocalDate slotDate;

        /** Giờ bắt đầu — kết hợp slotDate để tạo thành khung giờ đầy đủ. */
        @NotNull(message = "Giờ bắt đầu không được null")
        @Column(name = "start_time", nullable = false)
        private LocalTime startTime;

        /** Giờ kết thúc — tính từ startTime + service.durationMinutes (FR-4). */
        @NotNull(message = "Giờ kết thúc không được null")
        @Column(name = "end_time", nullable = false)
        private LocalTime endTime;

        /** Số booking tối đa cho slot này — admin set khi tạo slot. */
        @Min(value = 1, message = "Sức chứa tối thiểu là 1")
        @Max(value = 50, message = "Sức chứa tối đa là 50")
        @Column(name = "max_capacity", nullable = false)
        @Builder.Default
        private Integer maxCapacity = 1;

        /**
         * FR-6: @Version — JPA dùng field này làm version check khi UPDATE.
         * TX1 và TX2 cùng đọc currentBookings=2, cùng tăng lên 3:
         *   TX1 commit trước → DB version tăng.
         *   TX2 commit sau   → version mismatch → OptimisticLockException.
         * Service bắt exception → trả lỗi "slot đã đầy".
         */
        @Version
        @Column(name = "current_bookings", nullable = false)
        @Builder.Default
        private Integer currentBookings = 0;

        /**
         * Trạng thái slot:
         *   open   → còn chỗ, nhận booking mới
         *   full   → currentBookings >= maxCapacity, không nhận thêm
         *   closed → admin đóng thủ công hoặc slot đã qua
         */
        @NotNull(message = "Status không được null")
        @Column(name = "status", nullable = false, length = 10)
        @Enumerated(EnumType.STRING)
        @Builder.Default
        private SlotStatus status = SlotStatus.open;

        /** Audit — set tự động bởi AuditingEntityListener khi INSERT. */
        @CreatedDate
        @Column(name = "created_at", nullable = false, updatable = false)
        private LocalDateTime createdAt;

        /** Audit — set tự động bởi AuditingEntityListener khi UPDATE. */
        @LastModifiedDate
        @Column(name = "updated_at")
        private LocalDateTime updatedAt;

        public enum SlotStatus { open, full, closed }

        // ── FR-6 Helpers ─────────────────────────────────────────────────────────

        /** Kiểm tra còn chỗ — gọi trước khi incrementBookings(). */
        public boolean hasCapacity() {
                return SlotStatus.open.equals(this.status)
                        && this.currentBookings < this.maxCapacity;
        }

        /** Gọi khi booking được xác nhận — tự chuyển status → full khi đủ chỗ. */
        public void incrementBookings() {
                this.currentBookings++;
                if (this.currentBookings >= this.maxCapacity) {
                        this.status = SlotStatus.full;
                }
        }

        /** Gọi khi booking bị huỷ/no_show — mở lại slot cho waitlist (FR-6). */
        public void decrementBookings() {
                if (this.currentBookings > 0) this.currentBookings--;
                if (SlotStatus.full.equals(this.status) && this.currentBookings < this.maxCapacity) {
                        this.status = SlotStatus.open;
                }
        }
}