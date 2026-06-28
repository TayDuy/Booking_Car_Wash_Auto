package com.autowash.backend.promotion.service;

import com.autowash.backend.promotion.dto.*;
import com.autowash.backend.promotion.entity.Promotion;
import com.autowash.backend.promotion.service.impl.PromotionServiceImpl;
import jakarta.persistence.EntityNotFoundException;

import java.time.LocalDate;
import java.util.List;

/**
 * Service interface định nghĩa các nghiệp vụ liên quan đến Promotion.
 * Implementation: {@link PromotionServiceImpl}.
 */
public interface PromotionService {

    /**
     * Tạo mới một promotion.
     *
     * @param request         dữ liệu promotion từ client
     * @param createdByEmail ID của admin/staff đang tạo promotion
     * @return promotion vừa tạo dưới dạng DTO
     */
    PromotionResponseDTO create(PromotionRequestDTO request, String createdByEmail);

    /**
     * Lấy thông tin chi tiết của một promotion theo ID.
     *
     * @param id ID của promotion
     * @return DTO chứa thông tin đầy đủ
     * @throws EntityNotFoundException nếu không tìm thấy
     */
    PromotionResponseDTO getById(Integer id);

    /**
     * Lấy danh sách tất cả promotion (mọi trạng thái, không filter).
     * Dùng cho trang quản trị khi không cần lọc.
     */
    List<PromotionResponseDTO> getAll();

    /**
     * Lấy danh sách promotion với filter tùy chọn — dùng cho trang admin.
     * Tất cả tham số đều nullable: null = không lọc theo tiêu chí đó.
     *
     * @param status       lọc theo trạng thái (null = tất cả)
     * @param vehicleType  lọc theo loại xe (null = tất cả)
     * @param discountType lọc theo loại giảm giá (null = tất cả)
     * @param date         lọc promotion còn hiệu lực tại ngày này (null = không lọc)
     */
    List<PromotionResponseDTO> getAll(
            Promotion.PromotionStatus status,
            Promotion.VehicleType vehicleType,
            Promotion.DiscountType discountType,
            LocalDate date
    );

    /**
     * Lấy danh sách các promotion đang active.
     * Dùng cho client-facing (người dùng chọn khuyến mãi).
     */
    List<PromotionResponseDTO> getAllActive();

    /**
     * Cập nhật thông tin promotion. Không thay đổi status và người tạo.
     *
     * @param id      ID của promotion cần cập nhật
     * @param request dữ liệu mới từ client
     * @return DTO sau khi cập nhật
     */
    PromotionResponseDTO update(Integer id, PromotionRequestDTO request);

    /**
     * Vô hiệu hoá một promotion (chuyển status → inactive).
     * Không xoá khỏi DB để giữ lại lịch sử.
     *
     * @param id ID của promotion cần vô hiệu hoá
     */
    void deactivate(Integer id);

    /**
     * Kiểm tra và tính toán số tiền giảm khi áp dụng promotion vào đơn hàng.
     *
     * @param request thông tin đơn hàng và promotion muốn áp dụng
     * @return kết quả gồm applicable, discountAmount, finalAmount
     */
    PromotionApplyResponseDTO applyPromotion(PromotionApplyRequestDTO request);

    /**
     * Lấy lịch sử sử dụng của một promotion.
     *
     * @param promotionId ID của promotion
     * @return danh sách lịch sử sử dụng promotion
     */
    List<PromotionUseResponseDTO> getPromotionUses(Integer promotionId);

    /**
     * Lấy lịch sử promotion mà một customer đã sử dụng.
     *
     * @param customerId ID của customer
     * @return danh sách promotion customer đã dùng
     */
    List<PromotionUseResponseDTO> getCustomerPromotionUses(Integer customerId);
    /**
     * Tự động chuyển các promotion đã hết hạn nhưng còn active sang expired.
     *
     * @return số lượng promotion đã được cập nhật
     */
    int expireExpiredPromotions();
}