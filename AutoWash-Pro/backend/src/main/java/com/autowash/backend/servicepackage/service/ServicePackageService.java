package com.autowash.backend.servicepackage.service;

import com.autowash.backend.servicepackage.dto.ServicePackageRequest;
import com.autowash.backend.servicepackage.dto.ServicePackageResponse;

import java.util.List;

public interface ServicePackageService {
    ServicePackageResponse createServicePackage(ServicePackageRequest request);
    ServicePackageResponse updateServicePackage(Integer serviceId, ServicePackageRequest request);
    ServicePackageResponse getServicePackageById(Integer serviceId);
    List<ServicePackageResponse> getAllServicePackages();

}
