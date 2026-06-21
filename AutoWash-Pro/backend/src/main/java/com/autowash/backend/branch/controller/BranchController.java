package com.autowash.backend.branch.controller;

import com.autowash.backend.branch.dto.BranchRequestDTO;
import com.autowash.backend.branch.dto.BranchResponseDTO;
import com.autowash.backend.branch.entity.Branch.BranchStatus;
import com.autowash.backend.branch.service.BranchService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller xử lý các HTTP request liên quan đến Chi nhánh (Branch).
 *
 * <p>Base URL: {@code /api/v1/branches}</p>
 *
 * <h3>Danh sách endpoints:</h3>
 * <pre>
 * GET    /api/v1/branches                  Lấy danh sách chi nhánh (filter theo ?status=)
 * GET    /api/v1/branches/{id}             Lấy chi tiết một chi nhánh
 * POST   /api/v1/branches                  Tạo chi nhánh mới
 * PUT    /api/v1/branches/{id}             Cập nhật thông tin chi nhánh
 * PATCH  /api/v1/branches/{id}/status      Đổi trạng thái chi nhánh
 * DELETE /api/v1/branches/{id}             Soft delete (chuyển sang CLOSED)
 * </pre>
 *
 * <h3>Error handling:</h3>
 * Các exception từ service layer ({@code EntityNotFoundException},
 * {@code IllegalArgumentException}) được xử lý tập trung bởi
 * {@code GlobalExceptionHandler} (@ControllerAdvice), không cần try-catch ở đây.
 */
@RestController
@RequestMapping("/api/v1/branches")
@RequiredArgsConstructor  // Inject BranchService qua constructor (best practice, không dùng @Autowired field)
public class BranchController {

    private final BranchService branchService;

    // ====================================================================
    //  GET /api/v1/branches?status=open
    // ====================================================================

    /**
     * Lấy danh sách chi nhánh.
     *
     * <p>Query param {@code status} là tuỳ chọn:</p>
     * <ul>
     *   <li>{@code GET /branches}               → trả về tất cả chi nhánh</li>
     *   <li>{@code GET /branches?status=open}    → chỉ trả về chi nhánh đang mở</li>
     *   <li>{@code GET /branches?status=closed}  → chỉ trả về chi nhánh đã đóng</li>
     * </ul>
     *
     * @param status (optional) lọc theo trạng thái; null = lấy tất cả
     * @return 200 OK + danh sách DTO (có thể là list rỗng [])
     */
    @GetMapping
    public ResponseEntity<List<BranchResponseDTO>> getAll(
            @RequestParam(required = false) BranchStatus status) {
        return ResponseEntity.ok(branchService.findAll(status));
    }

    // ====================================================================
    //  GET /api/v1/branches/{id}
    // ====================================================================

    /**
     * Lấy chi tiết một chi nhánh theo ID.
     *
     * @param id ID của chi nhánh cần tra cứu
     * @return 200 OK + DTO chi tiết
     *         404 Not Found nếu không tìm thấy (xử lý bởi GlobalExceptionHandler)
     */
    @GetMapping("/{id}")
    public ResponseEntity<BranchResponseDTO> getById(@PathVariable Integer id) {
        return ResponseEntity.ok(branchService.findById(id));
    }

    // ====================================================================
    //  POST /api/v1/branches
    // ====================================================================

    /**
     * Tạo chi nhánh mới.
     *
     * <p>{@code @Valid} kích hoạt Bean Validation trên {@link BranchRequestDTO}
     * trước khi method được gọi. Nếu validation fail, Spring tự trả 400 Bad Request.</p>
     *
     * @param request body JSON chứa thông tin chi nhánh mới
     * @return 201 Created + DTO chi nhánh vừa tạo (có ID và timestamp)
     *         400 Bad Request nếu request không hợp lệ
     *         409 Conflict nếu tên đã tồn tại (xử lý bởi GlobalExceptionHandler)
     */
    @PostMapping
    public ResponseEntity<BranchResponseDTO> create(
            @Valid @RequestBody BranchRequestDTO request) {
        BranchResponseDTO created = branchService.create(request);
        // Trả về 201 Created thay vì 200 OK vì đây là tạo resource mới (REST convention)
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    // ====================================================================
    //  PUT /api/v1/branches/{id}
    // ====================================================================

    /**
     * Cập nhật thông tin chi nhánh (partial update được hỗ trợ).
     *
     * <p>Mặc dù dùng HTTP PUT (thường ngụ ý full replace), implementation
     * hỗ trợ partial update nhờ mapper bỏ qua field null.
     * Client có thể chỉ truyền field cần thay đổi.</p>
     *
     * @param id      ID chi nhánh cần cập nhật
     * @param request body JSON chứa thông tin cần thay đổi
     * @return 200 OK + DTO sau khi cập nhật
     *         404 Not Found nếu không tìm thấy ID
     */
    @PutMapping("/{id}")
    public ResponseEntity<BranchResponseDTO> update(
            @PathVariable Integer id,
            @Valid @RequestBody BranchRequestDTO request) {
        return ResponseEntity.ok(branchService.update(id, request));
    }

    // ====================================================================
    //  PATCH /api/v1/branches/{id}/status?status=maintenance
    // ====================================================================

    /**
     * Thay đổi trạng thái hoạt động của chi nhánh.
     *
     * <p>Dùng PATCH thay vì PUT vì chỉ cập nhật một field duy nhất.
     * Truyền status qua query param để URL ngắn gọn, không cần request body.</p>
     *
     * <p>Ví dụ: {@code PATCH /api/v1/branches/3/status?status=maintenance}</p>
     *
     * @param id     ID chi nhánh cần đổi trạng thái
     * @param status trạng thái mới (open / closed / maintenance)
     * @return 200 OK + DTO sau khi đổi trạng thái
     *         404 Not Found nếu không tìm thấy ID
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<BranchResponseDTO> changeStatus(
            @PathVariable Integer id,
            @RequestParam BranchStatus status) {
        return ResponseEntity.ok(branchService.changeStatus(id, status));
    }

    // ====================================================================
    //  DELETE /api/v1/branches/{id}
    // ====================================================================

    /**
     * Soft delete chi nhánh (chuyển status về CLOSED, không xóa khỏi DB).
     *
     * <p>Trả về {@code 204 No Content} thay vì 200 vì không có body cần trả về
     * – đây là convention chuẩn REST cho DELETE thành công.</p>
     *
     * @param id ID chi nhánh cần đóng
     * @return 204 No Content khi thành công
     *         404 Not Found nếu không tìm thấy ID
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> softDelete(@PathVariable Integer id) {
        branchService.softDelete(id);
        return ResponseEntity.noContent().build();  // HTTP 204
    }
}