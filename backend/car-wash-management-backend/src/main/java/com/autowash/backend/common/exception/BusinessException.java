package com.autowash.backend.common.exception;

public class BusinessException extends RuntimeException {

    private final int errorCode; // Mã lỗi tùy chỉnh tương ứng trong ApiResponse

    public BusinessException(String message, int errorCode) {
        super(message);
        this.errorCode = errorCode;
    }

    public int getErrorCode() {
        return errorCode;
    }
}
