package com.autowash.backend.branch.dto;

import com.autowash.backend.branch.entity.Branch.BranchStatus;
import jakarta.validation.constraints.*;
import lombok.*;

/**
 * DTO đầu vào cho các thao tác tạo mới và cập nhật Branch.
 *
 * <p>Được dùng chung cho cả CREATE (POST) và UPDATE (PUT).
 * Validation annotation ở đây độc lập với entity để có thể
 * thay đổi rule mà không ảnh hưởng tầng persistence.</p>
 *
 * <p>Khi UPDATE, những field null sẽ bị bỏ qua nhờ
 * {@code NullValuePropertyMappingStrategy.IGNORE} trong {@link BranchMapper}.</p>
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BranchRequestDTO {

    /**
     * Tên chi nhánh – bắt buộc, unique ở tầng service.
     * Tối đa 100 ký tự, khớp với column definition trong entity.
     */
    @NotBlank(message = "Tên chi nhánh không được để trống")
    @Size(max = 100, message = "Tên chi nhánh tối đa 100 ký tự")
    private String branchName;

    /**
     * Địa chỉ vật lý của chi nhánh.
     * Tối đa 255 ký tự theo thiết kế DB.
     */
    @NotBlank(message = "Địa chỉ không được để trống")
    @Size(max = 255, message = "Địa chỉ tối đa 255 ký tự")
    private String address;

    /**
     * Số điện thoại liên hệ của chi nhánh.
     * Chấp nhận các định dạng: +84901234567, 0901-234-567, (028) 1234 5678, ...
     * Pattern cho phép chữ số, dấu +, -, khoảng trắng và dấu ngoặc.
     */
    @NotBlank(message = "Số điện thoại không được để trống")
    @Size(max = 15, message = "Số điện thoại tối đa 15 ký tự")
    @Pattern(regexp = "^[0-9+\\-\\s()]{7,15}$", message = "Số điện thoại không hợp lệ")
    private String phone;

    /**
     * Số lượng xe tối đa có thể phục vụ đồng thời tại chi nhánh.
     * Dùng để kiểm soát capacity khi tạo TimeSlot.
     * Mặc định là 1 nếu client không truyền lên.
     */
    @Min(value = 1, message = "Capacity tối thiểu là 1")
    @Max(value = 100, message = "Capacity tối đa là 100")
    @Builder.Default
    private Integer capacity = 1;

    /**
     * Trạng thái hoạt động của chi nhánh.
     * Khi CREATE: để null → service sẽ tự set mặc định là {@code OPEN}.
     * Khi UPDATE: để null → giữ nguyên status hiện tại.
     *
     * @see BranchStatus
     */
    private BranchStatus status;
}