package com.autowash.backend.auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

//dto nhận dữ liệu từ Fontend khi gọi Api cấp lại access token
@Data
@NoArgsConstructor @AllArgsConstructor
public class TokenRefreshRequestDTO {

    //yêu cầu Fontend bắt buộc phải truyền lên refresh token
    @NotBlank(message = "Refresh Token không được để trống")
    private String refreshToken;

}
