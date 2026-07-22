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
    @Pattern(regexp = "^[\\p{L}\\p{N} .'-]+$", message ="Tên chỉ được chứa chữ cái, số, dấu cách và dấu chấm")
    private String fullName;

    @Past(message = "Ngày sinh phải là một ngày trong quá khứ")
    private LocalDate dateOfBirth;

    @Pattern(regexp = "^(male|female|Nam|Nữ|Khác)$", message = "Giới tính không hợp lệ")
    private String gender;

    @Pattern(regexp = "^0(3[2-9]|5[25689]|7[06-9]|8[1-9]|9[0-9])[0-9]{7}$",
            message = "Số điện thoại không đúng định dạng (VD: 0912345678)")
    private String phone;

    private String email;

    private Boolean allowDataSharing;
}