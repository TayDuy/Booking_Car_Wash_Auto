package com.autowash.backend.systemsetting.service;

import com.autowash.backend.systemsetting.dto.SystemSettingRequestDTO;
import com.autowash.backend.systemsetting.dto.SystemSettingResponseDTO;

public interface SystemSettingService {

    SystemSettingResponseDTO getSettings();

    SystemSettingResponseDTO updateSettings(
            SystemSettingRequestDTO request
    );

    SystemSettingResponseDTO resetSettings();
}