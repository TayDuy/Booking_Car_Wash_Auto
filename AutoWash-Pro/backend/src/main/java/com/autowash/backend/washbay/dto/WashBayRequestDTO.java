package com.autowash.backend.washbay.dto;

import com.autowash.backend.washbay.entity.WashBay.BayStatus;
import jakarta.validation.constraints.*;
import lombok.*;

/**
 * DTO nhận từ client khi tạo mới hoặc cập nhật WashBay.
 *
 * <p>Dùng cho cả CREATE (POST) và UPDATE (PUT) — các field nullable
 * cho phép partial update: chỉ field nào không null mới được cập nhật.</p>
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WashBayRequestDTO {

    /**
     * ID chi nhánh mà bay này thuộc về.
     * Bắt buộc khi tạo mới, optional khi update.
     */
    @NotNull(message = "Branch ID không được null")
    private Integer branchId;

    /**
     * Tên định danh của bay (VD: "Bay 1", "Bay A").
     * Tối đa 50 ký tự, không được để trống.
     */
    @NotBlank(message = "Tên bay không được để trống")
    @Size(max = 50, message = "Tên bay tối đa 50 ký tự")
    private String bayName;

    /**
     * Trạng thái vật lý của bay: available / occupied / maintenance.
     * Nullable — nếu null khi tạo mới, service mặc định là {@code available}.
     */
    private BayStatus status;

    /**
     * Số lượng xe tối đa bay có thể phục vụ cùng lúc.
     * Nullable — nếu null khi tạo mới, service mặc định là {@code 1}.
     */
    @Min(value = 1, message = "Capacity tối thiểu là 1")
    private Integer capacity;
}