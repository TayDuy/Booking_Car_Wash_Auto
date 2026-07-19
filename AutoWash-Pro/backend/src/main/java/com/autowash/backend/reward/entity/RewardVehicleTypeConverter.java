package com.autowash.backend.reward.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class RewardVehicleTypeConverter implements AttributeConverter<Reward.RewardVehicleType, String> {

    @Override
    public String convertToDatabaseColumn(Reward.RewardVehicleType attribute) {
        return attribute == null ? null : attribute.getValue();
    }

    @Override
    public Reward.RewardVehicleType convertToEntityAttribute(String dbData) {
        return dbData == null ? null : Reward.RewardVehicleType.fromValue(dbData);
    }
}