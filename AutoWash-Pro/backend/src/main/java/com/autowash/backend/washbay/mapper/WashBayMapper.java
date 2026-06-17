package com.autowash.backend.washbay.mapper;

import com.autowash.backend.washbay.dto.WashBayResponseDTO;
import com.autowash.backend.washbay.entity.WashBay;
import org.springframework.stereotype.Component;

/**
 * Chuyển đổi giữa {@link WashBay} entity và {@link WashBayResponseDTO}.
 *
 * <p>Tách riêng thay vì viết trong service để:
 * <ul>
 *   <li>Service chỉ tập trung vào logic nghiệp vụ</li>
 *   <li>Mapper có thể test độc lập</li>
 *   <li>Dễ thay thế bằng MapStruct sau này nếu cần</li>
 * </ul>
 * </p>
 */
@Component
public class WashBayMapper {

    /**
     * Chuyển {@link WashBay} entity → {@link WashBayResponseDTO}.
     *
     * <p>Join thêm {@code branchId} và {@code branchName} từ
     * {@code bay.getBranch()} — cần đảm bảo branch đã được load
     * (không lazy uninitialized) trước khi gọi hàm này.</p>
     */
    public WashBayResponseDTO toResponse(WashBay bay) {
        return WashBayResponseDTO.builder()
                .bayId(bay.getBayId())
                .branchId(bay.getBranch().getBranchId())
                .branchName(bay.getBranch().getBranchName())
                .bayName(bay.getBayName())
                .status(bay.getStatus())
                .capacity(bay.getCapacity())
                .createdAt(bay.getCreatedAt())
                .updatedAt(bay.getUpdatedAt())
                .build();
    }
}