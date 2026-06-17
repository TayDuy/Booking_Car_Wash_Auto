package com.autowash.backend.vehicle.entity;

import com.autowash.backend.customer.entity.Customer;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

/**
 * Xe ô tô của khách hàng — mỗi booking gắn với một xe cụ thể.
 * Loại xe (VehicleType) ảnh hưởng đến thời lượng và giá dịch vụ.
 */
@Entity
@Table(name = "vehicle")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@ToString(exclude = {"customer"})
public class Vehicle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Integer vehicleId;

    @NotNull(message = "Customer không được null")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_vehicle_customer"))
    private Customer customer;

    @NotBlank(message = "Biển số xe không được để trống")
    @Size(max = 20)
    @Column(name = "license_plate", nullable = false, unique = true, length = 20)
    private String licensePlate;

    @NotBlank(message = "Hãng xe không được để trống")
    @Size(max = 50)
    @Column(name = "brand", nullable = false, length = 50)
    private String brand;

    @NotBlank(message = "Dòng xe không được để trống")
    @Size(max = 50)
    @Column(name = "model", nullable = false, length = 50)
    private String model;

    @NotNull(message = "Loại xe không được null")
    @Enumerated(EnumType.STRING)
    @Column(name = "vehicle_type", nullable = false, length = 20)
    private VehicleType vehicleType;

    @Size(max = 20)
    @Column(name = "color", length = 20)
    private String color;

    @Size(max = 50)
    @Column(name = "nickname", length =  50)
    private String nickname;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum VehicleType {
        car,
        suv,
        truck
    }
}