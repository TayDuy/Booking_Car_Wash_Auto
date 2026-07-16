package com.autowash.backend.systemsetting.repository;

import com.autowash.backend.systemsetting.entity.SystemSetting;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SystemSettingRepository
        extends JpaRepository<SystemSetting, Integer> {
}