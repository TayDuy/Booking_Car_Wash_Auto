package com.autowash.backend.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class OtpVerifyDTO {

    @NotBlank(message = "số điện thoại không được để trống!!!")
    @Pattern(regexp = "^(0|\\+84)[0-9]{9}$",
            message = "số điện thoại không đúng định dạng")
    private String phone;

    @NotBlank(message = "Mã otp không được để trống !!!")
    @Size(min = 6, max = 6, message ="OTP phải đúng 6 số")
    private String otp;

}
