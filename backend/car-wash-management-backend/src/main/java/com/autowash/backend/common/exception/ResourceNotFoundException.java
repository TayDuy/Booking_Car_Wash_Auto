package com.autowash.backend.common.exception;

public class ResourceNotFoundException extends BusinessException {

    public ResourceNotFoundException(String message) {
        super(message, 404); // 404 là mã lỗi tự định nghĩa cho Not Found
    }
}
