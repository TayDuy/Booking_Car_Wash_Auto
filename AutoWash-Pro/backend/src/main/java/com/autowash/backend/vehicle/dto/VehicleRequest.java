package com.autowash.backend.vehicle.dto;

import com.autowash.backend.vehicle.entity.Vehicle.VehicleType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class VehicleRequest {

    @NotBlank(message = "Biển số xe không được để trống")
    @Pattern(regexp = "^[0-9]{2}[A-Z]-[0-9]{4,5}$", message = "Biển số xe sai định dạng (VD: 30A-12345)")
    private String licensePlate;

    @NotBlank(message = "Hãng xe không được để trống")
    @Size(min = 2, max = 50, message = "Hãng xe phải từ 2 đến 50 ký tự")
    private String brand;

    @NotBlank(message = "Dòng xe không được để trống")
    @Size(min = 1, max = 50, message = "Dòng xe phải từ 1 đến 50 ký tự")
    private String model;

    @NotNull(message = "Loại xe không được để trống")
    private VehicleType vehicleType;

    @Size(max = 20,message = "Màu sắc không được dài quá 20 ký tự")
    private String color;

    @Size(max = 50, message = "Tên gọi(nickname) không được dài quá 50 ký tự")
    private String nickname;
}
