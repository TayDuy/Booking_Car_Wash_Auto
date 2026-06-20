package com.autowash.backend.servicepackage.controller;

import com.autowash.backend.servicepackage.dto.ServicePackageRequest;
import com.autowash.backend.servicepackage.dto.ServicePackageResponse;
import com.autowash.backend.servicepackage.entity.ServicePackage;
import com.autowash.backend.servicepackage.service.ServicePackageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class ServicePackageController {

    //Nhúng Service vào Controller
    private final ServicePackageService servicePackageService;

    /**
     * 1. TẠO MỚI gói dịch vụ (Chỉ Admin)
     * - @PreAuthorize: Lớp bảo vệ thứ 2. Nếu token không phải Admin -> văng 403 ngay tại đây, không cho vào hàm.
     * - @PostMapping: Nhận request HTTP POST từ client gửi lên.
     * - @RequestBody: Tự động "mở hộp" JSON từ client ra thành object ServicePackageRequest.
     * - @Valid: Kiểm tra dữ liệu đầu vào (không null, đúng định dạng...) trước khi xử lý.
     * - HttpStatus.CREATED (201): Trả về mã 201 thay vì 200 để báo "Tạo mới thành công".
     */
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/admin/service-packages")
    public ResponseEntity<ServicePackageResponse> createServicePackage(@Valid@RequestBody ServicePackageRequest request){
        return new ResponseEntity<>(servicePackageService.createServicePackage(request), HttpStatus.CREATED);
    }

    /**
     * 2. LẤY DANH SÁCH tất cả gói dịch vụ (Khách hàng & Admin đều xem được)
     * - Không có @PreAuthorize: Ai đăng nhập cũng xem được (khách hàng cần xem để chọn gói).
     * - @GetMapping: Nhận request HTTP GET (chỉ đọc dữ liệu, không thay đổi gì).
     * - ResponseEntity.ok(): Trả về mã 200 OK kèm danh sách gói dịch vụ.
     * - List<ServicePackageResponse>: Trả về một danh sách (mảng) các gói, không phải 1 cái.
     */
    @GetMapping("/service-packages")
    public ResponseEntity<List<ServicePackageResponse>> getAllServicePackages(){
        return ResponseEntity.ok(servicePackageService.getAllServicePackages());
    }

    /**
     * 3. LẤY CHI TIẾT 1 gói dịch vụ theo ID (Khách hàng & Admin đều xem được)
     * - @GetMapping("/service-packages/{id}"): {id} là biến động trên URL. VD: /service-packages/3
     * - @PathVariable("id"): Trích xuất số 3 từ URL và gán vào tham số Integer id.
     * - Trả về 1 object (không phải List) vì chỉ tìm đúng 1 gói theo ID.
     * - Nếu không tìm thấy ID đó -> Service sẽ ném ResourceNotFoundException -> trả về 404.
     */
    @GetMapping("/service-packages/{id}")
    public ResponseEntity<ServicePackageResponse> getServicePackageById(@PathVariable("id") Integer id){
        return ResponseEntity.ok(servicePackageService.getServicePackageById(id));
    }

    /**
     * 4. CẬP NHẬT gói dịch vụ theo ID (Chỉ Admin)
     * - @PreAuthorize: Chặn ngay nếu không phải Admin.
     * - @PutMapping: Nhận request HTTP PUT - dùng để CẬP NHẬT toàn bộ dữ liệu của 1 bản ghi.
     *   (Khác với PATCH chỉ cập nhật 1 phần, PUT thay toàn bộ).
     * - Nhận cả 2 tham số: id (từ URL) + request (từ Body JSON) để biết sửa cái nào và sửa thành gì.
     * - Trả về object đã được cập nhật để client biết dữ liệu mới nhất.
     */
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/admin/service-packages/{id}")
    public ResponseEntity<ServicePackageResponse> updateServicePackage(@PathVariable("id") Integer id, @Valid@RequestBody ServicePackageRequest request){
        return ResponseEntity.ok(servicePackageService.updateServicePackage(id,request));
    }

}
