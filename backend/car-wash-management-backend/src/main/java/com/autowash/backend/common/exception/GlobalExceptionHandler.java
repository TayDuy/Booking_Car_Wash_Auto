package com.autowash.backend.common.exception;

import com.autowash.backend.common.dto.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // 1. Xử lý các lỗi BusinessException do ta chủ động ném ra
    @ExceptionHandler(value = BusinessException.class)
    public ResponseEntity<ApiResponse<Object>> handleBusinessException(BusinessException exception) {
        ApiResponse<Object> apiResponse = ApiResponse.builder()
                .code(exception.getErrorCode())
                .message(exception.getMessage())
                .build();
        return ResponseEntity.badRequest().body(apiResponse);
    }

    // 2. Xử lý tất cả các lỗi hệ thống không lường trước được khác (NullPointer, SQL,...)
    @ExceptionHandler(value = Exception.class)
    public ResponseEntity<ApiResponse<Object>> handleRuntimeException(Exception exception) {
        ApiResponse<Object> apiResponse = ApiResponse.builder()
                .code(9999) // Mã đại diện cho lỗi hệ thống chung
                .message("Đã xảy ra sự cố hệ thống: " + exception.getMessage())
                .build();
        return ResponseEntity.internalServerError().body(apiResponse);
    }
}
