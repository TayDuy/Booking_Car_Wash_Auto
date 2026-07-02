package com.autowash.backend.serviceprice.entity;

import com.autowash.backend.servicepackage.entity.ServicePackage;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "service_price")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ServicePrice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "service_price_id")
    private Integer servicePriceId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "service_id", nullable = false)
    private ServicePackage service;

    @Column(name = "vehicle_type", nullable = false, length = 50)
    private String vehicleType;

    @Column(name = "price", nullable = false)
    private BigDecimal price;

    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", insertable = false)
    private LocalDateTime updatedAt;
}