package com.autowash.backend.user.enums;

/**
 * Ba nhóm người dùng chính của hệ thống.
 *
 * CUSTOMER:
 * - Sử dụng trang khách hàng.
 * - Tạo và quản lý booking của chính mình.
 *
 * EMPLOYEE:
 * - Sử dụng trang vận hành nhân viên.
 * - Check-in, xử lý xe và tạo booking hộ khách.
 *
 * ADMIN:
 * - Sử dụng trang quản trị.
 * - Quản lý toàn bộ hệ thống.
 */
public enum Role {
    CUSTOMER,
    EMPLOYEE,
    ADMIN
}