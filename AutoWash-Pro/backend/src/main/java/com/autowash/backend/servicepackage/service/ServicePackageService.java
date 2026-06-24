package com.autowash.backend.servicepackage.service;

import com.autowash.backend.servicepackage.dto.ServicePackageRequestDTO;
import com.autowash.backend.servicepackage.dto.ServicePackageResponseDTO;
import java.util.List;

public interface ServicePackageService {

    /**
     * Lấy tất cả dịch vụ đang active (isActive = true).
     */
    List<ServicePackageResponseDTO> getAllActive();

    /**
     * Lấy tất cả dịch vụ (kể cả inactive) — dành cho admin.
     */
    List<ServicePackageResponseDTO> getAll();

    /**
     * Lấy chi tiết 1 dịch vụ theo ID.
     */
    ServicePackageResponseDTO getById(Integer id);

    /**
     * Tạo mới dịch vụ. Throw nếu tên đã tồn tại.
     */
    ServicePackageResponseDTO create(ServicePackageRequestDTO request);

    /**
     * Cập nhật dịch vụ theo ID (partial update).
     */
    ServicePackageResponseDTO update(Integer id, ServicePackageRequestDTO request);

    /**
     * Xóa mềm: chỉ set isActive = false thay vì DELETE khỏi DB.
     */
    void deactivate(Integer id);
}
