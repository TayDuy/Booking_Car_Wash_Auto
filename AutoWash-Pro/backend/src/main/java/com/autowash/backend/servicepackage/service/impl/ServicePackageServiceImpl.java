package com.autowash.backend.servicepackage.service.impl;

import com.autowash.backend.servicepackage.dto.ServicePackageDetailResponseDTO;
import com.autowash.backend.servicepackage.dto.ServicePackageRequestDTO;
import com.autowash.backend.servicepackage.dto.ServicePackageResponseDTO;
import com.autowash.backend.servicepackage.entity.ServicePackage;
import com.autowash.backend.servicepackage.mapper.ServicePackageMapper;
import com.autowash.backend.servicepackage.repository.ServicePackageRepository;
import com.autowash.backend.servicepackage.service.ServicePackageService;
import com.autowash.backend.serviceprice.service.ServicePriceService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Toàn bộ logic nghiệp vụ nằm ở đây, controller chỉ làm nhiệm vụ routing.
 *
 * @Transactional(readOnly = true) trên class giúp tối ưu các query đọc.
 * Các method ghi sẽ override bằng @Transactional riêng.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ServicePackageServiceImpl implements ServicePackageService {

    private final ServicePackageRepository repository;
    private final ServicePackageMapper mapper;
    private final ServicePriceService priceService;

    @Override
    public List<ServicePackageResponseDTO> getAllActive() {
        return repository.findByIsActiveTrue()
                .stream()
                .map(mapper::toResponse)
                .toList();
    }

    @Override
    public List<ServicePackageResponseDTO> getAll() {
        return repository.findAll()
                .stream()
                .map(mapper::toResponse)
                .toList();
    }

    @Override
    public ServicePackageResponseDTO getById(Integer id) {
        ServicePackage entity = findOrThrow(id);
        return mapper.toResponse(entity);
    }

    @Override
    public ServicePackageDetailResponseDTO getDetailById(Integer id) {
        ServicePackage entity = findOrThrow(id);
        ServicePackageResponseDTO base = mapper.toResponse(entity);
        return ServicePackageDetailResponseDTO.builder()
                .serviceId(base.getServiceId())
                .serviceName(base.getServiceName())
                .description(base.getDescription())
                .basePrice(base.getBasePrice())
                .durationMinutes(base.getDurationMinutes())
                .isActive(base.getIsActive())
                .createdAt(base.getCreatedAt())
                .updatedAt(base.getUpdatedAt())
                .prices(priceService.getPricesByService(id))
                .build();
    }

    @Override
    @Transactional
    public ServicePackageResponseDTO create(ServicePackageRequestDTO request) {
        // Kiểm tra trùng tên trước khi insert
        if (repository.existsByServiceName(request.getServiceName())) {
            throw new IllegalArgumentException(
                    "Dịch vụ '" + request.getServiceName() + "' đã tồn tại"
            );
        }
        ServicePackage entity = mapper.toEntity(request);
        return mapper.toResponse(repository.save(entity));
    }

    @Override
    @Transactional
    public ServicePackageResponseDTO update(Integer id, ServicePackageRequestDTO request) {
        ServicePackage entity = findOrThrow(id);

        // Kiểm tra trùng tên nếu client đổi tên sang tên khác
        if (request.getServiceName() != null
                && !request.getServiceName().equals(entity.getServiceName())
                && repository.existsByServiceName(request.getServiceName())) {
            throw new IllegalArgumentException(
                    "Tên dịch vụ '" + request.getServiceName() + "' đã được dùng"
            );
        }

        mapper.updateEntity(request, entity);
        return mapper.toResponse(repository.save(entity));
    }

    @Override
    @Transactional
    public void deactivate(Integer id) {
        ServicePackage entity = findOrThrow(id);
        entity.setIsActive(false);
        repository.save(entity);
    }

    // ── Helper ────────────────────────────────────────────────────────────────

    private ServicePackage findOrThrow(Integer id) {
        return repository.findById(id)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException(
                        "Không tìm thấy dịch vụ với id = " + id
                ));
    }
}