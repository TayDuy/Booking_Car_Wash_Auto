package com.autowash.backend.systemsetting.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "system_setting")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SystemSetting {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "shop_name", nullable = false, length = 150)
    private String shopName;

    @Column(length = 30)
    private String hotline;

    @Column(length = 150)
    private String email;

    @Column(length = 255)
    private String website;

    @Column(length = 500)
    private String address;

    @Column(name = "open_time", length = 10)
    private String openTime;

    @Column(name = "close_time", length = 10)
    private String closeTime;

    private Integer vat;

    @Column(name = "max_booking_days")
    private Integer maxBookingDays;

    @Column(name = "cancel_before_hours")
    private Integer cancelBeforeHours;

    @Column(name = "max_vehicle_per_slot")
    private Integer maxVehiclePerSlot;

    @Column(name = "silver_bookings")
    private Integer silverBookings;

    @Column(name = "gold_bookings")
    private Integer goldBookings;

    @Column(name = "vip_bookings")
    private Integer vipBookings;

    @Column(name = "email_notification")
    private Boolean emailNotification;

    @Column(name = "sms_notification")
    private Boolean smsNotification;

    @Column(name = "push_notification")
    private Boolean pushNotification;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        if (shopName == null) shopName = "WashFlow Pro";
        if (openTime == null) openTime = "08:00";
        if (closeTime == null) closeTime = "20:00";
        if (vat == null) vat = 8;
        if (maxBookingDays == null) maxBookingDays = 30;
        if (cancelBeforeHours == null) cancelBeforeHours = 24;
        if (maxVehiclePerSlot == null) maxVehiclePerSlot = 6;
        if (silverBookings == null) silverBookings = 10;
        if (goldBookings == null) goldBookings = 30;
        if (vipBookings == null) vipBookings = 60;
        if (emailNotification == null) emailNotification = true;
        if (smsNotification == null) smsNotification = false;
        if (pushNotification == null) pushNotification = true;

        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}