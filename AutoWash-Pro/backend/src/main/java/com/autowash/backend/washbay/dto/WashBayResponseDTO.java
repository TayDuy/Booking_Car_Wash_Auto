package com.autowash.backend.washbay.dto;

import com.autowash.backend.washbay.entity.WashBay.BayStatus;
import lombok.*;

import java.time.LocalDateTime;

/**
 * DTO trả về client sau khi tạo / cập nhật / query WashBay.
 *
 * <p>Bao gồm thông tin join từ {@code Branch} (branchName)
 * để client không cần gọi thêm API chi nhánh.</p>
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WashBayResponseDTO {

    /** ID định danh của bay. */
    private Integer bayId;

    /** ID chi nhánh mà bay này thuộc về. */
    private Integer branchId;

    /** Tên chi nhánh — join từ Branch entity, tiện cho client hiển thị. */
    private String branchName;

    /** Tên bay (VD: "Bay 1", "Bay A"). */
    private String bayName;

    /** Trạng thái vật lý hiện tại: available / occupied / maintenance. */
    private BayStatus status;

    /** Số lượng xe tối đa bay có thể phục vụ cùng lúc. */
    private Integer capacity;

    /** Thời điểm tạo bay — do {@code @CreatedDate} tự set, không nhận từ client. */
    private LocalDateTime createdAt;

    /** Thời điểm cập nhật gần nhất — do {@code @LastModifiedDate} tự set. */
    private LocalDateTime updatedAt;
}