package com.autowash.backend.vehicle.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class VehicleTypeConverter implements AttributeConverter<Vehicle.VehicleType, String> {

    @Override
    public String convertToDatabaseColumn(Vehicle.VehicleType attribute) {
        return attribute == null ? null : attribute.getValue();
    }

    @Override
    public Vehicle.VehicleType convertToEntityAttribute(String dbData) {
        return dbData == null ? null : Vehicle.VehicleType.fromValue(dbData);
    }
}