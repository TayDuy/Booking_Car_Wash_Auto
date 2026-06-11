package com.autowash.backend.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class OtpRequestDTO {

    @NotBlank(message = "số điện thoại không được để trống")
    @Pattern(regexp = "^(0|\\+84)[0-9]{9}$",
            message = "số điện thoại không đúng định dạng")
    private String phone;

}
