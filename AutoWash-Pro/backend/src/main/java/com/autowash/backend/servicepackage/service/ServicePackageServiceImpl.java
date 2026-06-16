package com.autowash.backend.servicepackage.service;

import com.autowash.backend.common.exception.ResourceNotFoundException;
import com.autowash.backend.servicepackage.dto.ServicePackageRequest;
import com.autowash.backend.servicepackage.dto.ServicePackageResponse;
import com.autowash.backend.servicepackage.entity.ServicePackage;
import com.autowash.backend.servicepackage.repository.ServicePackageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ServicePackageServiceImpl implements ServicePackageService{
    //NHÚNG - INJECT kho chứa Database
    private final ServicePackageRepository repository;

    @Override
    public ServicePackageResponse createServicePackage(ServicePackageRequest request) {
        //Đập hộp Request -> Nặn ra Entity
        ServicePackage servicePackage = ServicePackage.builder()
                .serviceName(request.getServiceName())
                .description(request.getDescription())
                .basePrice(request.getBasePrice())
                .durationMinutes(request.getDurationMinutes() != null ? request.getDurationMinutes() : 30)
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .build();

        //Lưu xuống DB -> Trả lên-> Map thành hộp Response
        return mapToResponse(repository.save(servicePackage));
    }

    @Override
    public ServicePackageResponse updateServicePackage(Integer serviceId, ServicePackageRequest request) {
        ServicePackage servicePackage = repository.findById(serviceId)
                .orElseThrow(() -> new ResourceNotFoundException("Gói dịch vụ","id",serviceId));

        servicePackage.setServiceName(request.getServiceName());
        servicePackage.setDescription(request.getDescription());
        servicePackage.setBasePrice(request.getBasePrice());
        if(request.getDurationMinutes() != null)
            servicePackage.setDurationMinutes(request.getDurationMinutes());
        if(request.getIsActive() != null)
            servicePackage.setIsActive(request.getIsActive());

        return mapToResponse(repository.save(servicePackage));
    }

    @Override
    public ServicePackageResponse getServicePackageById(Integer serviceId) {

        ServicePackage servicePackage = repository.findById(serviceId)
                .orElseThrow(()-> new ResourceNotFoundException("Gói dịch vụ","id",serviceId));
        return mapToResponse(servicePackage);
    }

    @Override
    public List<ServicePackageResponse> getAllServicePackages() {
        return repository.findAll().stream().map(this::mapToResponse).toList();
    }

    private ServicePackageResponse mapToResponse(ServicePackage servicePackage){
        return ServicePackageResponse.builder()
                .serviceId(servicePackage.getServiceId())
                .serviceName(servicePackage.getServiceName())
                .description(servicePackage.getDescription())
                .basePrice(servicePackage.getBasePrice())
                .durationMinutes(servicePackage.getDurationMinutes())
                .isActive(servicePackage.getIsActive())
                .createdAt(servicePackage.getCreatedAt())
                .updatedAt(servicePackage.getUpdatedAt())
                .build();
    }

}
