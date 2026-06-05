package com.autowash.backend.auth.service;

import com.autowash.backend.auth.dto.LoginRequestDTO;
import com.autowash.backend.auth.dto.LoginResponseDTO;
import com.autowash.backend.auth.dto.RegisterRequestDTO;

public interface AuthService {

    LoginResponseDTO login(LoginRequestDTO request);

    void register(RegisterRequestDTO request);
}
