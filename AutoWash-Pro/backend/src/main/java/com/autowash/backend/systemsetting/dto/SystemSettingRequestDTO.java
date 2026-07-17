package com.autowash.backend.systemsetting.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SystemSettingRequestDTO {

    private String shopName;
    private String hotline;
    private String email;
    private String website;
    private String address;

    private String openTime;
    private String closeTime;
    private Integer vat;

    private Integer maxBookingDays;
    private Integer cancelBeforeHours;
    private Integer maxVehiclePerSlot;

    private Integer silverBookings;
    private Integer goldBookings;
    private Integer vipBookings;

    private Boolean emailNotification;
    private Boolean smsNotification;
    private Boolean pushNotification;
}