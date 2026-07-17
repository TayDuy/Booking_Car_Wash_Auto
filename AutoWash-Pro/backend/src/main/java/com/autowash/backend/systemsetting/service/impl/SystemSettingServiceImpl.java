package com.autowash.backend.systemsetting.service.impl;

import com.autowash.backend.auditlog.service.AuditLogService;
import com.autowash.backend.systemsetting.dto.SystemSettingRequestDTO;
import com.autowash.backend.systemsetting.dto.SystemSettingResponseDTO;
import com.autowash.backend.systemsetting.entity.SystemSetting;
import com.autowash.backend.systemsetting.repository.SystemSettingRepository;
import com.autowash.backend.systemsetting.service.SystemSettingService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class SystemSettingServiceImpl implements SystemSettingService {

    private final SystemSettingRepository repository;
    private final AuditLogService auditLogService;

    @Override
    public SystemSettingResponseDTO getSettings() {
        SystemSetting setting = repository.findAll()
                .stream()
                .findFirst()
                .orElseGet(this::createDefault);

        return toDTO(setting);
    }

    @Override
    public SystemSettingResponseDTO updateSettings(
            SystemSettingRequestDTO request
    ) {
        SystemSetting setting = repository.findAll()
                .stream()
                .findFirst()
                .orElseGet(this::createDefault);

        validate(request);

        setting.setShopName(request.getShopName());
        setting.setHotline(request.getHotline());
        setting.setEmail(request.getEmail());
        setting.setWebsite(request.getWebsite());
        setting.setAddress(request.getAddress());

        setting.setOpenTime(request.getOpenTime());
        setting.setCloseTime(request.getCloseTime());
        setting.setVat(request.getVat());

        setting.setMaxBookingDays(request.getMaxBookingDays());
        setting.setCancelBeforeHours(request.getCancelBeforeHours());
        setting.setMaxVehiclePerSlot(request.getMaxVehiclePerSlot());

        setting.setSilverBookings(request.getSilverBookings());
        setting.setGoldBookings(request.getGoldBookings());
        setting.setVipBookings(request.getVipBookings());

        setting.setEmailNotification(request.getEmailNotification());
        setting.setSmsNotification(request.getSmsNotification());
        setting.setPushNotification(request.getPushNotification());

        SystemSetting saved = repository.save(setting);

        auditLogService.logCurrentUser(
                "UPDATE_SYSTEM_SETTING",
                null,
                "Cập nhật cấu hình hệ thống"
        );

        return toDTO(saved);
    }

    @Override
    public SystemSettingResponseDTO resetSettings() {
        repository.deleteAll();

        SystemSetting setting = createDefault();

        auditLogService.logCurrentUser(
                "RESET_SYSTEM_SETTING",
                null,
                "Khôi phục cấu hình hệ thống mặc định"
        );

        return toDTO(setting);
    }

    private SystemSetting createDefault() {
        return repository.save(
                SystemSetting.builder()
                        .shopName("WashFlow Pro")
                        .hotline("1900 1080")
                        .email("admin@washflow.vn")
                        .website("https://washflow.vn")
                        .address("TP.HCM, Việt Nam")
                        .openTime("08:00")
                        .closeTime("20:00")
                        .vat(8)
                        .maxBookingDays(30)
                        .cancelBeforeHours(24)
                        .maxVehiclePerSlot(6)
                        .silverBookings(10)
                        .goldBookings(30)
                        .vipBookings(60)
                        .emailNotification(true)
                        .smsNotification(false)
                        .pushNotification(true)
                        .build()
        );
    }

    private void validate(SystemSettingRequestDTO request) {
        if (request.getShopName() == null
                || request.getShopName().isBlank()) {
            throw new IllegalArgumentException(
                    "Tên cửa hàng không được để trống"
            );
        }

        if (request.getVat() == null
                || request.getVat() < 0
                || request.getVat() > 100) {
            throw new IllegalArgumentException(
                    "VAT phải nằm trong khoảng 0 đến 100"
            );
        }

        if (request.getSilverBookings() != null
                && request.getGoldBookings() != null
                && request.getVipBookings() != null) {

            if (request.getSilverBookings() >= request.getGoldBookings()
                    || request.getGoldBookings() >= request.getVipBookings()) {
                throw new IllegalArgumentException(
                        "Mốc Silver phải nhỏ hơn Gold và Gold phải nhỏ hơn VIP"
                );
            }
        }
    }

    private SystemSettingResponseDTO toDTO(SystemSetting setting) {
        return SystemSettingResponseDTO.builder()
                .id(setting.getId())
                .shopName(setting.getShopName())
                .hotline(setting.getHotline())
                .email(setting.getEmail())
                .website(setting.getWebsite())
                .address(setting.getAddress())
                .openTime(setting.getOpenTime())
                .closeTime(setting.getCloseTime())
                .vat(setting.getVat())
                .maxBookingDays(setting.getMaxBookingDays())
                .cancelBeforeHours(setting.getCancelBeforeHours())
                .maxVehiclePerSlot(setting.getMaxVehiclePerSlot())
                .silverBookings(setting.getSilverBookings())
                .goldBookings(setting.getGoldBookings())
                .vipBookings(setting.getVipBookings())
                .emailNotification(setting.getEmailNotification())
                .smsNotification(setting.getSmsNotification())
                .pushNotification(setting.getPushNotification())
                .build();
    }
}