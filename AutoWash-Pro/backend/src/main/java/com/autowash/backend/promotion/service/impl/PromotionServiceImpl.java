package com.autowash.backend.promotion.service.impl;

import com.autowash.backend.loyaltytier.entity.LoyaltyTier;
import com.autowash.backend.loyaltytier.repository.LoyaltyTierRepository;
import com.autowash.backend.promotion.dto.*;
import com.autowash.backend.promotion.entity.Promotion;
import com.autowash.backend.promotion.entity.Promotion.PromotionStatus;
import com.autowash.backend.promotion.entity.PromotionUse;
import com.autowash.backend.promotion.mapper.PromotionMapper;
import com.autowash.backend.promotion.repository.PromotionRepository;
import com.autowash.backend.promotion.repository.PromotionUseRepository;
import com.autowash.backend.promotion.service.PromotionService;
import com.autowash.backend.user.entity.User;
import com.autowash.backend.user.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import com.autowash.backend.auditlog.service.AuditLogService;

/**
 * Implementation của {@link PromotionService}.
 *
 * <p>Phân tách trách nhiệm:
 * <ul>
 *   <li>Validation nghiệp vụ (date range, entity tồn tại) → thực hiện tại đây.</li>
 *   <li>Validation format/constraint → khai báo ở DTO bằng annotation.</li>
 *   <li>Mapping entity ↔ DTO → uỷ thác cho {@link PromotionMapper}.</li>
 * </ul>
 */
@Service
@RequiredArgsConstructor
public class PromotionServiceImpl implements PromotionService {

    private final PromotionRepository promotionRepository;
    private final LoyaltyTierRepository loyaltyTierRepository;
    private final UserRepository userRepository;
    private final PromotionMapper promotionMapper;
    private final PromotionUseRepository promotionUseRepository;
    private final AuditLogService auditLogService;

    // ── CRUD ────────────────────────────────────────────────────────────────

    /**
     * {@inheritDoc}
     * Validate ngày hợp lệ, resolve tier và user trước khi persist.
     */
    @Override
    @Transactional
    public PromotionResponseDTO create(PromotionRequestDTO dto, String createdByEmail) {
        validateDateRange(dto);
        LoyaltyTier tier = resolveTier(dto.getTargetTierId());

        // Resolve email → User entity
        User creator = userRepository.findByEmail(createdByEmail)
                .orElseThrow(() -> new EntityNotFoundException(
                        "User không tồn tại: " + createdByEmail));

        Promotion promotion = promotionMapper.toEntity(dto, tier, creator);

        Promotion savedPromotion = promotionRepository.save(promotion);

        auditLogService.log(
                "CREATE_PROMOTION",
                createdByEmail,
                null,
                "Tạo khuyến mãi " + savedPromotion.getPromotionName()
        );

        return promotionMapper.toDTO(savedPromotion);
    }

    /** {@inheritDoc} */
    @Override
    @Transactional(readOnly = true)
    public PromotionResponseDTO getById(Integer id) {
        return promotionMapper.toDTO(findOrThrow(id));
    }

    /**
     * {@inheritDoc}
     * Trả về tất cả promotion không phân biệt trạng thái — dùng cho admin.
     */
    @Override
    @Transactional(readOnly = true)
    public List<PromotionResponseDTO> getAll() {
        return promotionRepository.findAll()
                .stream()
                .map(promotionMapper::toDTO)
                .toList();
    }

    /**
     * {@inheritDoc}
     * Chỉ trả về promotion có status = active — dùng cho client chọn khuyến mãi.
     * Lưu ý: promotion active nhưng hết hạn ngày vẫn được trả về ở đây;
     * field {@code valid} trong DTO phản ánh trạng thái thực tế.
     */
    @Override
    @Transactional(readOnly = true)
    public List<PromotionResponseDTO> getAllActive() {
        return promotionRepository.findByStatus(PromotionStatus.active)
                .stream()
                .map(promotionMapper::toDTO)
                .toList();
    }

    /**
     * {@inheritDoc}
     * Không cho phép thay đổi status qua endpoint này.
     * Dùng {@link #deactivate(Integer)} để vô hiệu hoá.
     */
    @Override
    @Transactional
    public PromotionResponseDTO update(Integer id, PromotionRequestDTO dto) {
        validateDateRange(dto);
        Promotion promotion = findOrThrow(id);
        LoyaltyTier tier = resolveTier(dto.getTargetTierId());
        promotionMapper.updateEntity(promotion, dto, tier);

        Promotion savedPromotion = promotionRepository.save(promotion);

        auditLogService.log(
                "UPDATE_PROMOTION",
                "admin",
                null,
                "Cập nhật khuyến mãi " + savedPromotion.getPromotionName()
        );

        return promotionMapper.toDTO(savedPromotion);
    }

    /**
     * {@inheritDoc}
     * Soft-delete bằng cách chuyển status → inactive thay vì xoá khỏi DB,
     * đảm bảo không mất lịch sử sử dụng của các đơn hàng trước đó.
     */
    @Override
    @Transactional
    public void deactivate(Integer id) {
        Promotion promotion = findOrThrow(id);
        promotion.setStatus(PromotionStatus.inactive);

        promotionRepository.save(promotion);

        auditLogService.log(
                "DELETE_PROMOTION",
                "admin",
                null,
                "Vô hiệu hóa khuyến mãi " + promotion.getPromotionName()
        );
    }

    // ── Apply logic ─────────────────────────────────────────────────────────

    /**
     * {@inheritDoc}
     *
     * <p>Luồng xử lý:
     * <ol>
     *   <li>Load promotion, kiểm tra toàn bộ điều kiện qua {@code isApplicable()}.</li>
     *   <li>Nếu không thoả → trả về {@code applicable=false}, giữ nguyên orderValue.</li>
     *   <li>Nếu thoả → tính {@code discountAmount} theo discountType,
     *       sau đó trả về {@code finalAmount = orderValue - discountAmount}.</li>
     * </ol>
     */
    @Override
    @Transactional
    public PromotionApplyResponseDTO applyPromotion(PromotionApplyRequestDTO req) {
        Promotion promotion = promotionRepository.findByIdWithLock(req.getPromotionId())
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException(
                        "Promotion không tồn tại: " + req.getPromotionId()));

        boolean alreadyUsed = promotionUseRepository
                .existsByPromotionIdAndCustomerId(
                        req.getPromotionId(),
                        req.getCustomerId()
                );

        if (alreadyUsed) {
            return PromotionApplyResponseDTO.builder()
                    .applicable(false)
                    .message("Customer đã sử dụng khuyến mãi này rồi.")
                    .discountAmount(BigDecimal.ZERO)
                    .finalAmount(req.getOrderValue())
                    .build();
        }

        if (promotion.getUsageLimit() != null) {
            long usedCount = promotionUseRepository.countByPromotionId(
                    promotion.getPromotionId()
            );

            if (usedCount >= promotion.getUsageLimit()) {
                return PromotionApplyResponseDTO.builder()
                        .applicable(false)
                        .message("Khuyến mãi đã hết lượt sử dụng.")
                        .discountAmount(BigDecimal.ZERO)
                        .finalAmount(req.getOrderValue())
                        .build();
            }
        }

        boolean applicable = promotion.isApplicable(
                req.getTierId(),
                req.getVehicleType(),
                req.getOrderValue()
        );

        if (!applicable) {
            return PromotionApplyResponseDTO.builder()
                    .applicable(false)
                    .message("Khuyến mãi không áp dụng được cho đơn hàng này.")
                    .discountAmount(BigDecimal.ZERO)
                    .finalAmount(req.getOrderValue())
                    .build();
        }

        BigDecimal discountAmount = calculateDiscount(
                promotion,
                req.getOrderValue()
        );

        BigDecimal finalAmount = req.getOrderValue()
                .subtract(discountAmount)
                .max(BigDecimal.ZERO);

        PromotionUse promotionUse = PromotionUse.builder()
                .promotionId(promotion.getPromotionId())
                .customerId(req.getCustomerId())
                .orderValue(req.getOrderValue())
                .discountAmount(discountAmount)
                .finalAmount(finalAmount)
                .status(PromotionUse.PromotionUseStatus.used)
                .usedAt(java.time.LocalDateTime.now())
                .build();

        promotionUseRepository.save(promotionUse);

        return PromotionApplyResponseDTO.builder()
                .applicable(true)
                .message("Áp dụng khuyến mãi thành công.")
                .discountAmount(discountAmount)
                .finalAmount(finalAmount)
                .build();
    }

    @Override
    public List<PromotionUseResponseDTO> getPromotionUses(Integer promotionId) {
        // Kiểm tra promotion có tồn tại không
        findOrThrow(promotionId);

        return promotionUseRepository
                .findByPromotionIdOrderByUsedAtDesc(promotionId)
                .stream()
                .map(this::toPromotionUseResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<PromotionUseResponseDTO> getCustomerPromotionUses(Integer customerId) {
        return promotionUseRepository
                .findByCustomerIdOrderByUsedAtDesc(customerId)
                .stream()
                .map(this::toPromotionUseResponse)
                .toList();
    }

    @Override
    @Transactional
    public int expireExpiredPromotions() {
        LocalDate today = LocalDate.now();

        List<Promotion> expiredPromotions =
                promotionRepository.findExpiredButActive(today);

        if (expiredPromotions.isEmpty()) {
            return 0;
        }

        expiredPromotions.forEach(promotion ->
                promotion.setStatus(PromotionStatus.expired)
        );

        promotionRepository.saveAll(expiredPromotions);

        return expiredPromotions.size();
    }

    // ── Private helpers ──────────────────────────────────────────────────────

    /**
     * Load Promotion theo ID, ném {@link EntityNotFoundException} nếu không tồn tại.
     */
    private Promotion findOrThrow(Integer id) {
        return promotionRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Promotion không tồn tại: " + id));
    }

    /**
     * Resolve LoyaltyTier từ ID.
     *
     * @param tierId null → promotion áp dụng tất cả tier, trả về null
     * @return entity LoyaltyTier hoặc null
     * @throws EntityNotFoundException nếu tierId khác null nhưng không tìm thấy
     */
    private LoyaltyTier resolveTier(Integer tierId) {
        if (tierId == null) return null;
        return loyaltyTierRepository.findById(tierId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "LoyaltyTier không tồn tại: " + tierId));
    }

    /**
     * Validate logic ngày: endDate phải >= startDate.
     * Gọi trước khi persist để tránh data không hợp lệ.
     *
     * @throws IllegalArgumentException nếu endDate trước startDate
     */
    private void validateDateRange(PromotionRequestDTO dto) {
        if (dto.getEndDate().isBefore(dto.getStartDate())) {
            throw new IllegalArgumentException(
                    "Ngày kết thúc phải sau hoặc bằng ngày bắt đầu.");
        }
    }

    /**
     * Tính số tiền được giảm dựa trên {@code discountType} của promotion.
     *
     * <ul>
     *   <li><b>percent</b>     → {@code orderValue × discountValue / 100}, làm tròn HALF_UP 2 chữ số</li>
     *   <li><b>fixed</b>       → {@code min(discountValue, orderValue)} — không giảm quá giá trị đơn</li>
     *   <li><b>free_service</b>→ {@code orderValue} — miễn phí toàn bộ</li>
     * </ul>
     *
     * @param promotion promotion đang áp dụng
     * @param orderValue giá trị đơn hàng gốc
     * @return số tiền được giảm (>= 0)
     */
    private BigDecimal calculateDiscount(Promotion promotion, BigDecimal orderValue) {
        return switch (promotion.getDiscountType()) {
            case percent -> orderValue
                    .multiply(promotion.getDiscountValue())
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

            // Giới hạn tối đa bằng orderValue để tránh discountAmount > orderValue
            case fixed -> promotion.getDiscountValue().min(orderValue);

            // Miễn phí toàn bộ: discount = toàn bộ giá trị đơn hàng
            case free_service -> orderValue;
        };
    }
    /**
     * {@inheritDoc}
     *
     * <p>Filter in-memory trên stream — phù hợp khi số lượng promotion
     * không quá lớn (vài trăm bản ghi). Nếu cần scale lên hàng nghìn,
     * chuyển sang JPA Specification hoặc {@code @Query} động.</p>
     */
    @Override
    @Transactional(readOnly = true)
    public List<PromotionResponseDTO> getAll(
            PromotionStatus status,
            Promotion.VehicleType vehicleType,
            Promotion.DiscountType discountType,
            LocalDate date) {

        return promotionRepository.findAll()
                .stream()
                // Lọc theo status nếu client truyền lên, bỏ qua nếu null
                .filter(p -> status == null
                        || p.getStatus().equals(status))
                // vehicleType null trên entity = promotion áp dụng tất cả loại xe
                .filter(p -> vehicleType == null
                        || p.getVehicleType() == null
                        || p.getVehicleType().equals(vehicleType))
                // Lọc theo discountType nếu client truyền lên, bỏ qua nếu null
                .filter(p -> discountType == null
                        || p.getDiscountType().equals(discountType))
                // Lọc promotion còn hiệu lực tại ngày date (startDate <= date <= endDate)
                .filter(p -> date == null
                        || (!date.isBefore(p.getStartDate())
                        && !date.isAfter(p.getEndDate())))
                .map(promotionMapper::toDTO)
                .toList();
    }

    private PromotionUseResponseDTO toPromotionUseResponse(PromotionUse promotionUse) {
        return PromotionUseResponseDTO.builder()
                .promotionUseId(promotionUse.getPromotionUseId())
                .promotionId(promotionUse.getPromotionId())
                .customerId(promotionUse.getCustomerId())
                .orderValue(promotionUse.getOrderValue())
                .discountAmount(promotionUse.getDiscountAmount())
                .finalAmount(promotionUse.getFinalAmount())
                .status(promotionUse.getStatus())
                .usedAt(promotionUse.getUsedAt())
                .build();
    }
}