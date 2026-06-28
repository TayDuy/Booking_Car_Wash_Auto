package com.autowash.backend.auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class GoogleLoginRequestDTO {

    @NotBlank(message = "Supabase Token không được để trống")
    private String supabaseToken;

}
