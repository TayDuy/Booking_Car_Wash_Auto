package com.autowash.backend.auth.dto;


import lombok.*;

@NoArgsConstructor
@AllArgsConstructor
@Data //co toan bo get set roi
@ToString
@Builder //giup ta new object khong can xai constructor
public class LoginResponseDTO {

    private String accessToken;
    private String tokenType = "Bearer";
    private Integer userId;
    private String username;
    private String email;
    private String fullName;
    private String role;

}