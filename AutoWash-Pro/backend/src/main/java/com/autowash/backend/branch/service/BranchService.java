package com.autowash.backend.branch.service;

<<<<<<< HEAD
import com.autowash.backend.branch.dto.BranchRequestDTO;
import com.autowash.backend.branch.dto.BranchResponseDTO;
import com.autowash.backend.branch.entity.Branch.BranchStatus;

import java.util.List;

/**
 * Service interface định nghĩa các use-case nghiệp vụ của Branch.
 *
 * <p>Tách interface ra khỏi implementation để:</p>
 * <ul>
 *   <li>Dễ viết unit test – mock interface thay vì class cụ thể.</li>
 *   <li>Tuân theo Dependency Inversion Principle (SOLID).</li>
 *   <li>Cho phép swap implementation (vd: thêm cache layer) mà không sửa Controller.</li>
 * </ul>
 *
 * <p>Implementation: {@link com.autowash.backend.branch.service.impl.BranchServiceImpl}</p>
 */
public interface BranchService {

    /**
     * Lấy danh sách tất cả chi nhánh, có thể lọc theo trạng thái.
     *
     * @param status nếu khác null thì chỉ trả về chi nhánh có status tương ứng;
     *               nếu null thì trả về tất cả
     * @return danh sách DTO chi nhánh (có thể rỗng, không bao giờ null)
     */
    List<BranchResponseDTO> findAll(BranchStatus status);

    /**
     * Lấy thông tin chi tiết một chi nhánh theo ID.
     *
     * @param branchId ID của chi nhánh cần tra cứu
     * @return DTO chứa đầy đủ thông tin chi nhánh
     * @throws jakarta.persistence.EntityNotFoundException nếu không tìm thấy ID
     */
    BranchResponseDTO findById(Integer branchId);

    /**
     * Tạo chi nhánh mới trong hệ thống.
     *
     * <p>Business rules:</p>
     * <ul>
     *   <li>Tên chi nhánh phải unique toàn hệ thống.</li>
     *   <li>Nếu không truyền {@code status}, mặc định là {@code OPEN}.</li>
     * </ul>
     *
     * @param request dữ liệu chi nhánh cần tạo
     * @return DTO chi nhánh vừa được tạo (đã có ID và timestamp)
     * @throws IllegalArgumentException nếu tên chi nhánh đã tồn tại
     */
    BranchResponseDTO create(BranchRequestDTO request);

    /**
     * Cập nhật thông tin chi nhánh (hỗ trợ partial update).
     *
     * <p>Chỉ những field khác null trong {@code request} mới được ghi đè.
     * Field null sẽ giữ nguyên giá trị hiện tại trong DB.</p>
     *
     * @param branchId ID chi nhánh cần cập nhật
     * @param request  dữ liệu mới (có thể partial)
     * @return DTO chi nhánh sau khi cập nhật
     * @throws jakarta.persistence.EntityNotFoundException nếu không tìm thấy ID
     * @throws IllegalArgumentException nếu tên mới đã bị chi nhánh khác dùng
     */
    BranchResponseDTO update(Integer branchId, BranchRequestDTO request);

    /**
     * Thay đổi trạng thái hoạt động của chi nhánh.
     *
     * <p>Tách riêng endpoint này (PATCH) thay vì gộp vào UPDATE (PUT) vì:</p>
     * <ul>
     *   <li>Đổi status là hành động operational, thường do admin thực hiện riêng.</li>
     *   <li>Tránh vô tình reset status khi client PUT toàn bộ record.</li>
     * </ul>
     *
     * @param branchId  ID chi nhánh cần đổi trạng thái
     * @param newStatus trạng thái mới muốn áp dụng
     * @return DTO chi nhánh với status đã được cập nhật
     * @throws jakarta.persistence.EntityNotFoundException nếu không tìm thấy ID
     */
    BranchResponseDTO changeStatus(Integer branchId, BranchStatus newStatus);

    /**
     * Xóa mềm chi nhánh bằng cách chuyển status về {@code CLOSED}.
     *
     * <p>Lý do không xóa cứng (hard delete):</p>
     * <ul>
     *   <li>Chi nhánh có thể đang được tham chiếu bởi Booking, TimeSlot, Employee.</li>
     *   <li>Cần giữ lịch sử để báo cáo, audit log.</li>
     *   <li>Có thể reopen lại bất cứ lúc nào qua {@link #changeStatus}.</li>
     * </ul>
     *
     * @param branchId ID chi nhánh cần đánh dấu đã đóng
     * @throws jakarta.persistence.EntityNotFoundException nếu không tìm thấy ID
     */
    void softDelete(Integer branchId);
}
=======
import com.autowash.backend.branch.dto.BranchRequest;
import com.autowash.backend.branch.dto.BranchResponse;

import java.util.List;

public interface BranchService {
    BranchResponse createBranch(BranchRequest request);
    BranchResponse updateBranch(Integer branchId, BranchRequest request);
    BranchResponse getBranchById(Integer branchId);

    List<BranchResponse> getAllBranches();


}
>>>>>>> origin/dev/Dung
