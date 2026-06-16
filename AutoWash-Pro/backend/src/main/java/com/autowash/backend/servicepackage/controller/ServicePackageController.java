package com.autowash.backend.servicepackage.controller;

import com.autowash.backend.servicepackage.dto.ServicePackageRequest;
import com.autowash.backend.servicepackage.dto.ServicePackageResponse;
import com.autowash.backend.servicepackage.entity.ServicePackage;
import com.autowash.backend.servicepackage.service.ServicePackageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class ServicePackageController {

    //Nhúng Service vào Controller
    private final ServicePackageService servicePackageService;
    @PostMapping("/admin/service-packages")
    public ResponseEntity<ServicePackageResponse> createServicePackage(@Valid@RequestBody ServicePackageRequest request){
        return new ResponseEntity<>(servicePackageService.createServicePackage(request), HttpStatus.CREATED);
    }

    @GetMapping("/service-packages")
    public ResponseEntity<List<ServicePackageResponse>> getAllServicePackages(){
        return ResponseEntity.ok(servicePackageService.getAllServicePackages());
    }

    @GetMapping("/service-packages/{id}")
    public ResponseEntity<ServicePackageResponse> getServicePackageById(@PathVariable("id") Integer id){
        return ResponseEntity.ok(servicePackageService.getServicePackageById(id));
    }

    @PutMapping("/admin/service-packages/{id}")
    public ResponseEntity<ServicePackageResponse> updateServicePackage(@PathVariable("id") Integer id, @Valid@RequestBody ServicePackageRequest request){
        return ResponseEntity.ok(servicePackageService.updateServicePackage(id,request));
    }

}
