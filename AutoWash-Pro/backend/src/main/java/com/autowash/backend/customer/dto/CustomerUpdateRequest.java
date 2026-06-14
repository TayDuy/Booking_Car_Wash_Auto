package com.autowash.backend.customer.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;

@Data
public class CustomerUpdateRequest {
    @NotBlank(message = "Tên không được để trống")
    @Size(min = 2, max = 100,message = "Tên không được vượt quá 100 ký tự")
    @Pattern(regexp = "^[\\p{L} .'-]+$", message ="Tên không được chứa số hoặc kí tự đặc biệt")
    private String fullName;

    @Past(message = "Ngày sinh phải là một ngày trong quá khứ")
    private LocalDate dateOfBirth;

    @Pattern(regexp = "^(male|female)$", message = "Giới tính phải là male hoặc female (viết thường)")
    private String gender;

}
