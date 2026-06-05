package com.autowash.backend.common.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {
    private int code = 1000;
    private String message;
    private T result;

    public ApiResponse() {}

    public ApiResponse(int code, String message, T result) {
        this.code = code;
        this.message = message;
        this.result = result;
    }

    public int getCode() { return code; }
    public void setCode(int code) { this.code = code; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public T getResult() { return result; }
    public void setResult(T result) { this.result = result; }

    // Builder pattern
    public static <T> ApiResponseBuilder<T> builder() {
        return new ApiResponseBuilder<>();
    }

    public static class ApiResponseBuilder<T> {
        private int code = 1000;
        private String message;
        private T result;

        ApiResponseBuilder() {}

        public ApiResponseBuilder<T> code(int code) {
            this.code = code;
            return this;
        }

        public ApiResponseBuilder<T> message(String message) {
            this.message = message;
            return this;
        }

        public ApiResponseBuilder<T> result(T result) {
            this.result = result;
            return this;
        }

        public ApiResponse<T> build() {
            return new ApiResponse<>(code, message, result);
        }
    }
}
