package com.autowash.backend.branch.service.impl;

import com.autowash.backend.branch.dto.BranchRequestDTO;
import com.autowash.backend.branch.dto.BranchResponseDTO;
import com.autowash.backend.branch.entity.Branch;
import com.autowash.backend.branch.entity.Branch.BranchStatus;
import com.autowash.backend.branch.mapper.BranchMapper;
import com.autowash.backend.branch.repository.BranchRepository;
import com.autowash.backend.branch.service.BranchService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Triển khai các nghiệp vụ của {@link BranchService}.
 *
 * <h3>Transaction strategy:</h3>
 * <ul>
 *   <li>Class-level {@code @Transactional(readOnly = true)}: tất cả method
 *       mặc định là read-only → Hibernate tắt dirty-checking, tăng hiệu năng.</li>
 *   <li>Các method ghi dữ liệu override bằng {@code @Transactional} (readOnly=false)
 *       để kích hoạt lại dirty-checking và flush.</li>
 * </ul>
 *
 * <h3>Logging:</h3>
 * Dùng {@code @Slf4j} để ghi log các thao tác write ở mức INFO,
 * giúp trace audit trail mà không cần AOP phức tạp.
 */
@Slf4j
@Service
@RequiredArgsConstructor                         // Lombok inject final field qua constructor
@Transactional(readOnly = true)                  // Mặc định toàn class là read-only transaction
public class BranchServiceImpl implements BranchService {

    private final BranchRepository branchRepository;
    private final BranchMapper branchMapper;     // Spring inject implementation do MapStruct sinh ra

    // ====================================================================
    //  READ operations
    // ====================================================================

    /**
     * {@inheritDoc}
     *
     * Nếu {@code status == null} → gọi {@code findAll()} lấy tất cả.
     * Nếu có status → gọi derived query để WHERE lọc ở DB, không load thừa.
     */
    @Override
    public List<BranchResponseDTO> findAll(BranchStatus status) {
        List<Branch> branches = (status != null)
                ? branchRepository.findByStatus(status)   // Lọc theo status ở DB level
                : branchRepository.findAll();                 // Lấy toàn bộ

        // Stream map từng entity sang DTO, không expose entity ra ngoài service layer
        return branches.stream()
                .map(branchMapper::toResponse)
                .toList();  // Java 16+: immutable list, không cần Collectors.toList()
    }

    /** {@inheritDoc} */
    @Override
    public BranchResponseDTO findById(Integer branchId) {
        // getOrThrow tập trung xử lý EntityNotFoundException, tránh lặp code
        return branchMapper.toResponse(getOrThrow(branchId));
    }

    // ====================================================================
    //  WRITE operations  –  override readOnly → false
    // ====================================================================

    /**
     * {@inheritDoc}
     *
     * Flow:
     * 1. Validate unique tên chi nhánh.
     * 2. Map request → entity.
     * 3. Set default status nếu client không truyền.
     * 4. Persist và trả về DTO.
     */
    @Override
    @Transactional  // readOnly=false – kích hoạt dirty-checking để flush INSERT
    public BranchResponseDTO create(BranchRequestDTO request) {
        // Guard: tên chi nhánh phải unique trong toàn hệ thống
        if (branchRepository.existsByBranchName(request.getBranchName())) {
            throw new IllegalArgumentException(
                    "Tên chi nhánh '%s' đã tồn tại".formatted(request.getBranchName()));
        }

        // Chuyển DTO → entity (branchId, auditing fields được ignore trong mapper)
        Branch branch = branchMapper.toEntity(request);

        // Client có thể không truyền status khi tạo mới → mặc định OPEN
        if (branch.getStatus() == null) {
            branch.setStatus(BranchStatus.open);
        }

        Branch saved = branchRepository.save(branch);
        log.info("[Branch] Tạo mới – id={}, name={}", saved.getBranchId(), saved.getBranchName());
        return branchMapper.toResponse(saved);
    }

    /**
     * {@inheritDoc}
     *
     * Flow:
     * 1. Tìm entity đang được JPA quản lý (managed entity).
     * 2. Validate tên không trùng với chi nhánh KHÁC.
     * 3. Mapper merge request vào entity (partial update, skip null).
     * 4. save() flush thay đổi; Spring Auditing tự cập nhật updatedAt.
     */
    @Override
    @Transactional  // readOnly=false để Hibernate flush UPDATE
    public BranchResponseDTO update(Integer branchId, BranchRequestDTO request) {
        Branch branch = getOrThrow(branchId);

        // Kiểm tra tên bị trùng với chi nhánh KHÁC (loại trừ chính mình khỏi check)
        if (branchRepository.existsByBranchNameAndBranchIdNot(request.getBranchName(), branchId)) {
            throw new IllegalArgumentException(
                    "Tên chi nhánh '%s' đã được chi nhánh khác sử dụng"
                            .formatted(request.getBranchName()));
        }

        // updateEntity chỉ ghi đè field != null nhờ NullValuePropertyMappingStrategy.IGNORE
        branchMapper.updateEntity(request, branch);

        Branch saved = branchRepository.save(branch);
        log.info("[Branch] Cập nhật – id={}", branchId);
        return branchMapper.toResponse(saved);
    }

    /**
     * {@inheritDoc}
     *
     * Lưu log cả status cũ lẫn mới để dễ audit sau này.
     */
    @Override
    @Transactional
    public BranchResponseDTO changeStatus(Integer branchId, BranchStatus newStatus) {
        Branch branch = getOrThrow(branchId);
        BranchStatus oldStatus = branch.getStatus();  // Lưu lại để log

        branch.setStatus(newStatus);
        Branch saved = branchRepository.save(branch);

        log.info("[Branch] Đổi status – id={}, {} → {}", branchId, oldStatus, newStatus);
        return branchMapper.toResponse(saved);
    }

    /**
     * {@inheritDoc}
     *
     * Chuyển status về CLOSED thay vì gọi repository.delete()
     * để bảo toàn dữ liệu lịch sử và tránh vi phạm foreign key
     * với bảng Booking / TimeSlot.
     */
    @Override
    @Transactional
    public void softDelete(Integer branchId) {
        Branch branch = getOrThrow(branchId);
        branch.setStatus(BranchStatus.closed);  // Đánh dấu không hoạt động, không xóa row
        branchRepository.save(branch);
        log.info("[Branch] Soft-delete – id={} → status=CLOSED", branchId);
    }

    // ====================================================================
    //  Helper
    // ====================================================================

    /**
     * Tìm entity theo ID hoặc ném {@link EntityNotFoundException}.
     *
     * <p>Tập trung xử lý lỗi "not found" tại một chỗ; tất cả method
     * trong class đều dùng chung helper này thay vì lặp lại logic.</p>
     *
     * <p>Controller sẽ bắt {@link EntityNotFoundException} và trả về
     * HTTP 404 thông qua {@code @ControllerAdvice} (GlobalExceptionHandler).</p>
     *
     * @param branchId ID cần tìm
     * @return entity đang được JPA quản lý (managed state)
     * @throws EntityNotFoundException khi không tìm thấy
     */
    private Branch getOrThrow(Integer branchId) {
        return branchRepository.findById(branchId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Không tìm thấy chi nhánh với id: " + branchId));
    }
}