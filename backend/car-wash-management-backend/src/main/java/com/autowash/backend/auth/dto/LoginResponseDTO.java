package com.autowash.backend.auth.dto;

public class LoginResponseDTO {
    private String token;
    private String username;
    private String role;

    public LoginResponseDTO() {}

    public LoginResponseDTO(String token, String username, String role) {
        this.token = token;
        this.username = username;
        this.role = role;
    }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    // Builder pattern
    public static LoginResponseDTOBuilder builder() {
        return new LoginResponseDTOBuilder();
    }

    public static class LoginResponseDTOBuilder {
        private String token;
        private String username;
        private String role;

        LoginResponseDTOBuilder() {}

        public LoginResponseDTOBuilder token(String token) {
            this.token = token;
            return this;
        }

        public LoginResponseDTOBuilder username(String username) {
            this.username = username;
            return this;
        }

        public LoginResponseDTOBuilder role(String role) {
            this.role = role;
            return this;
        }

        public LoginResponseDTO build() {
            return new LoginResponseDTO(token, username, role);
        }
    }
}
