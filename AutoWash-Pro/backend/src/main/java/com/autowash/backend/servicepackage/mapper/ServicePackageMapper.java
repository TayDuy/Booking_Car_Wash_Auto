package com.autowash.backend.servicepackage.mapper;

import com.autowash.backend.servicepackage.dto.ServicePackageRequestDTO;
import com.autowash.backend.servicepackage.dto.ServicePackageResponseDTO;
import com.autowash.backend.servicepackage.entity.ServicePackage;
import org.mapstruct.*;

/**
 * MapStruct mapper — code được sinh lúc compile, không có overhead runtime.
 *
 * NullValuePropertyMappingStrategy.IGNORE cho phép partial update:
 * client chỉ truyền field cần đổi, các field khác giữ nguyên.
 */
@Mapper(
        componentModel = "spring",
        nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE
)
public interface ServicePackageMapper {

    /** Entity → ResponseDTO (dùng khi GET). */
    ServicePackageResponseDTO toResponse(ServicePackage entity);

    /**
     * RequestDTO → Entity mới (dùng khi POST/CREATE).
     * Ignore các field do DB/Auditing tự quản lý.
     */
    @Mapping(target = "serviceId",  ignore = true)
    @Mapping(target = "createdAt",  ignore = true)
    @Mapping(target = "updatedAt",  ignore = true)
    ServicePackage toEntity(ServicePackageRequestDTO request);

    /**
     * Merge RequestDTO vào entity đang được JPA quản lý (dùng khi PUT/PATCH).
     * @MappingTarget nghĩa là MapStruct sẽ mutate entity thay vì tạo mới.
     */
    @Mapping(target = "serviceId",  ignore = true)
    @Mapping(target = "createdAt",  ignore = true)
    @Mapping(target = "updatedAt",  ignore = true)
    void updateEntity(ServicePackageRequestDTO request, @MappingTarget ServicePackage entity);
}