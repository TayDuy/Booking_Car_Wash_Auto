package com.autowash.backend.branch.dto;

import com.autowash.backend.branch.entity.Branch.BranchStatus;
import lombok.*;

import java.time.LocalDateTime;

/**
 * DTO đầu ra – dữ liệu chi nhánh trả về cho client.
 *
 * <p>Chủ động <b>không</b> expose {@code staffList} và {@code bookings}
 * để tránh hai vấn đề:</p>
 * <ul>
 *   <li>N+1 query – các collection được fetch LAZY trong entity.</li>
 *   <li>Lộ dữ liệu nhạy cảm không cần thiết ra ngoài API.</li>
 * </ul>
 *
 * <p>Nếu cần danh sách nhân viên/booking của chi nhánh,
 * hãy tạo endpoint riêng: {@code GET /branches/{id}/employees}.</p>
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BranchResponseDTO {

    /** ID nội bộ của chi nhánh, do DB tự sinh (AUTO INCREMENT). */
    private Integer branchId;

    /** Tên định danh của chi nhánh, unique trong hệ thống. */
    private String branchName;

    /** Địa chỉ vật lý nơi đặt chi nhánh. */
    private String address;

    /** Số điện thoại liên hệ trực tiếp của chi nhánh. */
    private String phone;

    /**
     * Số lượng xe có thể phục vụ đồng thời.
     * Dùng để hiển thị thông tin cho khách khi đặt lịch.
     */
    private Integer capacity;

    /**
     * Trạng thái hiện tại của chi nhánh.
     * Một trong: {@code open}, {@code closed}, {@code maintenance}.
     */
    private BranchStatus status;

    /**
     * Computed field – chi nhánh có nhận booking mới không.
     * {@code true} khi status == {@code open}, ngược lại {@code false}.
     * Được tính từ {@code Branch#isAcceptingBookings()} thông qua mapper,
     * giúp client không cần tự kiểm tra status string.
     */
    private boolean acceptingBookings;

    /** Thời điểm bản ghi được tạo, do Spring Auditing tự điền. */
    private LocalDateTime createdAt;

    /** Thời điểm bản ghi được cập nhật lần cuối, do Spring Auditing tự điền. */
    private LocalDateTime updatedAt;
}