package com.autowash.backend.washbay.service;

import com.autowash.backend.washbay.dto.WashBayRequestDTO;
import com.autowash.backend.washbay.dto.WashBayResponseDTO;
import com.autowash.backend.washbay.entity.WashBay.BayStatus;

import java.util.List;

/**
 * Interface định nghĩa các nghiệp vụ quản lý WashBay.
 *
 * <p>Tách interface / impl để:
 * <ul>
 *   <li>Controller phụ thuộc vào abstraction, không phụ thuộc implementation</li>
 *   <li>Dễ mock trong unit test</li>
 *   <li>Dễ swap implementation nếu cần</li>
 * </ul>
 * </p>
 */
public interface WashBayService {

    /** Tạo mới một wash bay trong chi nhánh. */
    WashBayResponseDTO create(WashBayRequestDTO dto);

    /** Lấy thông tin một bay theo ID. Ném {@code ResourceNotFoundException} nếu không tìm thấy. */
    WashBayResponseDTO getById(Integer bayId);

    /** Lấy toàn bộ danh sách bay trong hệ thống. */
    List<WashBayResponseDTO> getAll();

    /** Lấy danh sách bay theo chi nhánh. Ném {@code ResourceNotFoundException} nếu branch không tồn tại. */
    List<WashBayResponseDTO> getByBranch(Integer branchId);

    /** Cập nhật toàn bộ thông tin bay. Chỉ field không null trong dto mới được cập nhật. */
    WashBayResponseDTO update(Integer bayId, WashBayRequestDTO dto);

    /**
     * Chỉ cập nhật trạng thái vật lý của bay.
     * Dùng cho PATCH thay vì PUT để tránh ghi đè toàn bộ object.
     */
    WashBayResponseDTO updateStatus(Integer bayId, BayStatus status);

    /** Xóa bay khỏi hệ thống. Ném {@code ResourceNotFoundException} nếu không tìm thấy. */
    void delete(Integer bayId);
}