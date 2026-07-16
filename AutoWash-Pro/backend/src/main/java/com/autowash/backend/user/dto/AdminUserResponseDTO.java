package com.autowash.backend.user.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminUserResponseDTO {

    private Integer id;
    private String username;
    private String email;
    private String phone;
    private String role;
    private String status;
    private LocalDateTime createdAt;
}