package com.autowash.backend.timeslot.mapper;

import com.autowash.backend.timeslot.dto.TimeSlotRequestDTO;
import com.autowash.backend.timeslot.dto.TimeSlotResponseDTO;
import com.autowash.backend.timeslot.entity.TimeSlot;
import org.mapstruct.*;

/**
 * MapStruct mapper cho TimeSlot.
 *
 * Vì ResponseDTO dùng branchId/branchName thay vì object Branch,
 * cần @Mapping để chỉ MapStruct lấy đúng field từ nested entity.
 *
 * RequestDTO → Entity KHÔNG map branchId/bayId trực tiếp vì
 * chúng là FK — service phải lookup Branch/WashBay từ DB trước,
 * rồi set thủ công vào entity.
 */
@Mapper(
        componentModel = "spring",
        nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE
)
public interface TimeSlotMapper {

    /**
     * Entity → ResponseDTO.
     * Flatten nested Branch và WashBay thành các field phẳng.
     */
    @Mapping(target = "branchId",   source = "branch.branchId")
    @Mapping(target = "branchName", source = "branch.branchName")
    @Mapping(target = "bayId",      source = "washBay.bayId")
    @Mapping(target = "bayName",    source = "washBay.bayName")
    TimeSlotResponseDTO toResponse(TimeSlot entity);

    /**
     * RequestDTO → Entity mới (dùng khi CREATE).
     * branchId/bayId bị ignore vì phải lookup entity từ DB trong service.
     * currentBookings/status dùng @Builder.Default trên entity.
     */
    @Mapping(target = "slotId",          ignore = true)
    @Mapping(target = "branch",          ignore = true)  // service set sau khi lookup
    @Mapping(target = "washBay",         ignore = true)  // service set sau khi lookup
    @Mapping(target = "currentBookings", ignore = true)  // default = 0
    @Mapping(target = "createdAt",       ignore = true)
    @Mapping(target = "updatedAt",       ignore = true)
    TimeSlot toEntity(TimeSlotRequestDTO request);

    /**
     * Merge RequestDTO vào entity đang được JPA quản lý (dùng khi UPDATE).
     * branch/washBay vẫn ignore — service quyết định có đổi hay không.
     */
    @Mapping(target = "slotId",          ignore = true)
    @Mapping(target = "branch",          ignore = true)
    @Mapping(target = "washBay",         ignore = true)
    @Mapping(target = "currentBookings", ignore = true)
    @Mapping(target = "createdAt",       ignore = true)
    @Mapping(target = "updatedAt",       ignore = true)
    void updateEntity(TimeSlotRequestDTO request, @MappingTarget TimeSlot entity);
}