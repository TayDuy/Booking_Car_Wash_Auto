package com.autowash.backend.customer.dto;

import lombok.Builder;
import lombok.Getter;

/**
 * Trả về sau khi STAFF/ADMIN tạo khách hàng thành công.
 * generatedPassword chỉ khác null khi client không truyền password —
 * hệ thống tự sinh và trả về DUY NHẤT lần này để nhân viên cung cấp cho khách.
 */
@Getter
@Builder
public class AdminCreateCustomerResponseDTO {

    private CustomerProfileResponse customer;

    /** Chỉ có giá trị khi mật khẩu được hệ thống tự sinh. */
    private String generatedPassword;
}