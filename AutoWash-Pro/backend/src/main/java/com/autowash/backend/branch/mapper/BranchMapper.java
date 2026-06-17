package com.autowash.backend.branch.mapper;

import com.autowash.backend.branch.dto.BranchRequestDTO;
import com.autowash.backend.branch.dto.BranchResponseDTO;
import com.autowash.backend.branch.entity.Branch;
import org.mapstruct.*;

/**
 * MapStruct mapper chuyển đổi giữa {@link Branch} entity và các DTO.
 *
 * <h3>Tại sao dùng MapStruct thay vì tự viết tay?</h3>
 * <ul>
 *   <li>Code được sinh tại compile-time → phát hiện lỗi sớm, không overhead runtime.</li>
 *   <li>Giảm boilerplate set/get thủ công, dễ maintain khi thêm field mới.</li>
 *   <li>{@code NullValuePropertyMappingStrategy.IGNORE} hỗ trợ partial update tự nhiên.</li>
 * </ul>
 *
 * <h3>Dependency cần thêm vào pom.xml:</h3>
 * <pre>{@code
 * <dependency>
 *     <groupId>org.mapstruct</groupId>
 *     <artifactId>mapstruct</artifactId>
 *     <version>1.5.5.Final</version>
 * </dependency>
 * <dependency>
 *     <groupId>org.mapstruct</groupId>
 *     <artifactId>mapstruct-processor</artifactId>
 *     <version>1.5.5.Final</version>
 *     <scope>provided</scope>
 * </dependency>
 * }</pre>
 *
 * <p><b>Lưu ý Lombok + MapStruct:</b> trong {@code maven-compiler-plugin},
 * phải khai báo {@code lombok-maven-plugin} trước {@code mapstruct-processor}
 * để Lombok sinh getter/setter trước khi MapStruct đọc.</p>
 */
@Mapper(
        componentModel = "spring",          // Sinh ra @Component, inject được bằng @Autowired / constructor
        nullValuePropertyMappingStrategy    // Khi field nguồn là null → bỏ qua, giữ nguyên giá trị đích
                = NullValuePropertyMappingStrategy.IGNORE
)
public interface BranchMapper {

    /**
     * Chuyển Entity → Response DTO (dùng khi trả dữ liệu ra ngoài API).
     *
     * <p>Hầu hết các field trùng tên được MapStruct map tự động.
     * Riêng {@code acceptingBookings} phải dùng {@code expression} vì
     * đây là computed field từ method {@link Branch#isAcceptingBookings()},
     * không phải getter của một field thực trong entity.</p>
     *
     * @param branch entity cần chuyển đổi
     * @return response DTO đã được điền đầy đủ thông tin
     */
    @Mapping(
            target = "acceptingBookings",
            expression = "java(branch.isAcceptingBookings())"  // Gọi thẳng method của entity
    )
    BranchResponseDTO toResponse(Branch branch);

    /**
     * Chuyển Request DTO → Entity mới (dùng khi CREATE).
     *
     * <p>Các field bị ignore vì:</p>
     * <ul>
     *   <li>{@code branchId}  – do DB tự sinh (AUTO INCREMENT), không được set tay.</li>
     *   <li>{@code staffList}, {@code bookings} – quan hệ ngược, được quản lý ở phía Employee/Booking.</li>
     *   <li>{@code createdAt}, {@code updatedAt} – do Spring Auditing ({@code @CreatedDate},
     *       {@code @LastModifiedDate}) tự điền, override thủ công sẽ bị ghi đè.</li>
     * </ul>
     *
     * @param request dữ liệu đầu vào từ client
     * @return entity chưa được persist (chưa có ID)
     */
    @Mapping(target = "branchId",   ignore = true)
    @Mapping(target = "staffList",  ignore = true)
    @Mapping(target = "bookings",   ignore = true)
    @Mapping(target = "createdAt",  ignore = true)
    @Mapping(target = "updatedAt",  ignore = true)
    Branch toEntity(BranchRequestDTO request);

    /**
     * Merge Request DTO vào Entity đã tồn tại (dùng khi UPDATE).
     *
     * <p>Khác với {@link #toEntity}: method này nhận vào entity đang được
     * quản lý bởi JPA ({@code @MappingTarget}) và chỉ ghi đè những field
     * có giá trị khác null trong {@code request}.</p>
     *
     * <p>Điều này cho phép client thực hiện <b>partial update</b>:
     * chỉ truyền lên field cần thay đổi, các field khác giữ nguyên
     * nhờ {@code NullValuePropertyMappingStrategy.IGNORE} đã khai báo ở class level.</p>
     *
     * @param request dữ liệu cập nhật từ client
     * @param branch  entity đang được JPA quản lý, sẽ bị mutate trực tiếp
     */
    @Mapping(target = "branchId",   ignore = true)  // Không cho phép đổi ID
    @Mapping(target = "staffList",  ignore = true)  // Không quản lý quan hệ ở đây
    @Mapping(target = "bookings",   ignore = true)  // Không quản lý quan hệ ở đây
    @Mapping(target = "createdAt",  ignore = true)  // Auditing tự quản lý
    @Mapping(target = "updatedAt",  ignore = true)  // Auditing tự quản lý
    void updateEntity(BranchRequestDTO request, @MappingTarget Branch branch);
}