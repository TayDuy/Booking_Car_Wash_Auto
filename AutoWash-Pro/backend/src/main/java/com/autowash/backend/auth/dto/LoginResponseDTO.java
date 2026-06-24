package com.autowash.backend.auth.dto;


import lombok.*;

@NoArgsConstructor
@AllArgsConstructor
@Data //co toan bo get set roi
@ToString
@Builder //giup ta new object khong can xai constructor
public class LoginResponseDTO {

    private String accessToken;

    private String refreshToken;

    private String tokenType = "Bearer";
    private UserDto user;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserDto{
        private Integer userId;
        private String username;
        private String email;
        private String fullName;
        private String role;
        private Integer customerId;
        private Integer branchId;
    }

}