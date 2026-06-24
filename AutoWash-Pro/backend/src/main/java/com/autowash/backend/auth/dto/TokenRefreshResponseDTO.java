package com.autowash.backend.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor @AllArgsConstructor
public class TokenRefreshResponseDTO {

    //Access Token mới (sống ngắn hạn)
    private String accessToken;

    //Refresh Token cũ (hoặc mới tùy cấu hình, dùng để xin tiếp Access Token lần sau)
    private String refreshToken;

    //Loại token (mặc định là Bearer để Frontend gắn vào header)
    @Builder.Default
    private String tokenType = "Bearer";
}
