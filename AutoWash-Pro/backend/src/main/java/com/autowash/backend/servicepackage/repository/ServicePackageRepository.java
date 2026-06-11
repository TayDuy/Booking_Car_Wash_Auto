package com.autowash.backend.servicepackage.repository;

import com.autowash.backend.servicepackage.entity.ServicePackage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ServicePackageRepository extends JpaRepository<ServicePackage, Integer> {

    List<ServicePackage> findByIsActiveTrue();

    boolean existsByServiceName(String serviceName);
}