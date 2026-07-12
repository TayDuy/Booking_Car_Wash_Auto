package com.autowash.backend.reward.service.impl;

import com.autowash.backend.common.exception.BusinessException;
import com.autowash.backend.customer.entity.Customer;
import com.autowash.backend.loyaltytier.entity.LoyaltyTier;
import com.autowash.backend.loyaltytier.repository.LoyaltyTierRepository;
import com.autowash.backend.loyaltytransaction.entity.LoyaltyTransaction;
import com.autowash.backend.loyaltytransaction.repository.LoyaltyTransactionRepository;
import com.autowash.backend.reward.dto.RedeemRewardRequestDTO;
import com.autowash.backend.reward.dto.RedeemRewardResponseDTO;
import com.autowash.backend.reward.dto.RewardRequestDTO;
import com.autowash.backend.reward.dto.RewardResponseDTO;
import com.autowash.backend.reward.entity.Reward;
import com.autowash.backend.reward.mapper.RewardMapper;
import com.autowash.backend.reward.repository.RewardRepository;
import com.autowash.backend.reward.service.RewardService;
import com.autowash.backend.customerreward.service.CustomerRewardService;
import com.autowash.backend.customerreward.dto.CustomerRewardResponseDTO;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;


/**
 * Implementation của {@link RewardService}.
 *
 * <p>Toàn bộ class được đánh dấu {@code @Transactional(readOnly = true)} —
 * các method chỉ đọc sẽ dùng read-only transaction (tối ưu performance).
 * Các method ghi dữ liệu override thành {@code @Transactional} (readOnly = false).</p>
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RewardServiceImpl implements RewardService {

    private final RewardRepository rewardRepository;
    private final RewardMapper rewardMapper;
    private final LoyaltyTransactionRepository loyaltyTransactionRepository;
    private final com.autowash.backend.customer.repository.CustomerRepository customerRepository;
    private final com.autowash.backend.user.repository.UserRepository userRepository;
    private final LoyaltyTierRepository loyaltyTierRepository;
    private final CustomerRewardService customerRewardService;
    private final com.autowash.backend.customerreward.repository.CustomerRewardRepository customerRewardRepository;

    /**
     * {@inheritDoc}
     *
     * <p>Flow: DTO → entity (mapper) → save → response DTO.</p>
     */
    @Override
    @Transactional
    public RewardResponseDTO create(RewardRequestDTO dto) {
        Reward reward = rewardMapper.toEntity(dto);
        Reward saved = rewardRepository.save(reward);
        return rewardMapper.toResponse(saved);
    }

    /**
     * {@inheritDoc}
     *
     * <p>Ném {@link EntityNotFoundException} nếu không tìm thấy —
     * GlobalExceptionHandler sẽ bắt và trả về HTTP 404.</p>
     */
    @Override
    public RewardResponseDTO getById(Integer id) {
        return rewardMapper.toResponse(findOrThrow(id));
    }

    /**
     * {@inheritDoc}
     *
     * <p>Trả về toàn bộ reward không phân trang.
     * Nếu dữ liệu lớn, cân nhắc chuyển sang {@code Page<RewardResponseDTO>}.</p>
     */
    @Override
    public List<RewardResponseDTO> getAll() {
        return rewardRepository.findAll()
                .stream()
                .map(rewardMapper::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * {@inheritDoc}
     *
     * <p>Dùng {@code updateEntityFromDto} để patch — chỉ field không null mới bị ghi đè,
     * tránh vô tình reset các field client không gửi lên.</p>
     */
    @Override
    @Transactional
    public RewardResponseDTO update(Integer id, RewardRequestDTO dto) {
        Reward reward = findOrThrow(id);
        rewardMapper.updateEntityFromDto(dto, reward);
        return rewardMapper.toResponse(rewardRepository.save(reward));
    }

    /**
     * {@inheritDoc}
     *
     * <p>Soft-delete bằng cách set {@code status = inactive}.
     * Giữ nguyên bản ghi trong DB để không làm mất lịch sử redemption
     * đã liên kết với reward này.</p>
     */
    @Override
    @Transactional
    public void deactivate(Integer id) {
        Reward reward = findOrThrow(id);
        reward.setStatus(Reward.RewardStatus.inactive);
        rewardRepository.save(reward);
    }

    @Override
    public List<RewardResponseDTO> getRedeemableRewards(Integer customerId, String vehicleType, Integer userId) {
        validateCustomerOwner(customerId, userId);

        Integer currentPoints = getCurrentPoints(customerId);
        Integer customerTierLevel = getCustomerTierLevel(customerId);

        Reward.RewardStatus activeStatus = parseEnumIgnoreCase(Reward.RewardStatus.class, "active");
        Reward.RewardVehicleType requestedVehicleType =
                parseEnumIgnoreCase(Reward.RewardVehicleType.class, vehicleType);

        return rewardRepository.findAll()
                .stream()
                .filter(reward -> reward.getStatus().equals(activeStatus))
                .filter(reward -> reward.getRequiredPoints() <= currentPoints)
                .filter(reward -> isVehicleMatched(reward.getVehicleType(), requestedVehicleType))
                .filter(reward -> reward.getRequiredTierLevel() == null
                        || (customerTierLevel != null
                        && customerTierLevel >= reward.getRequiredTierLevel()))
                // Quà thăng hạng (welcome reward) chỉ được nhận/đổi tối đa 1 lần
                .filter(reward -> !reward.isWelcomeReward()
                        || !customerRewardRepository.existsByCustomer_CustomerIdAndReward_RewardId(customerId, reward.getRewardId()))
                .map(rewardMapper::toResponse)
                .toList();
    }

    // Chuc nang khi bam customer bam nut "Doi reward"
    /*
        1. Tìm reward theo id
        2. Kiểm tra reward active
        3. Kiểm tra loại xe
        4. Lấy điểm hiện tại
        5. Kiểm tra đủ điểm
        6. Tính điểm sau khi trừ
        7. Tạo LoyaltyTransaction mới
        8. Lưu database
        9. Trả response
    */
    @Override
    @Transactional
    public RedeemRewardResponseDTO redeemReward(Integer rewardId, RedeemRewardRequestDTO dto, Integer userId) {
        validateCustomerOwner(dto.customerId(), userId);

        Reward reward = findOrThrow(rewardId);

        // Ủy quyền gọi sang CustomerRewardService để trừ điểm và phát voucher
        CustomerRewardResponseDTO crResponse = customerRewardService.redeemReward(
                dto.customerId(),
                rewardId,
                userId
        );

        return new RedeemRewardResponseDTO(
                "Redeem reward successfully",
                dto.customerId(),
                rewardId,
                reward.getRewardName(),
                reward.getRequiredPoints(),
                crResponse.getRemainingPoints() + reward.getRequiredPoints(), // balanceBefore
                crResponse.getRemainingPoints() // balanceAfter
        );
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    /**
     * Tìm reward theo ID hoặc ném exception nếu không tồn tại.
     * Tập trung xử lý "not found" tại một chỗ, tránh lặp lại ở nhiều method.
     *
     * @param id primary key cần tìm
     * @return entity đang được JPA quản lý trong Persistence Context
     * @throws EntityNotFoundException nếu không tìm thấy reward với id tương ứng
     */
    private Reward findOrThrow(Integer id) {
        return rewardRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Reward không tồn tại, id=" + id));
    }

    private Integer getCurrentPoints(Integer customerId) {
        return loyaltyTransactionRepository
                .findTopByCustomerIdOrderByCreatedAtDesc(customerId)
                .map(LoyaltyTransaction::getBalanceAfter)
                .orElse(0);
    }

    private Integer getCustomerTierLevel(Integer customerId) {
        return customerRepository.findById(customerId)
                .map(Customer::getTierId)
                .flatMap(tierId -> loyaltyTierRepository.findById(tierId))
                .map(LoyaltyTier::getPriorityLevel)
                .orElse(null);
    }

    private boolean isVehicleMatched(Reward.RewardVehicleType rewardVehicleType,
                                     Reward.RewardVehicleType requestedVehicleType) {
        boolean exactMatch = rewardVehicleType.equals(requestedVehicleType);

        boolean bothMatch = Arrays.stream(Reward.RewardVehicleType.values())
                .filter(type -> type.name().equalsIgnoreCase("both"))
                .findFirst()
                .map(rewardVehicleType::equals)
                .orElse(false);

        return exactMatch || bothMatch;
    }

    private <E extends Enum<E>> E parseEnumIgnoreCase(Class<E> enumClass, String value) {
        return Arrays.stream(enumClass.getEnumConstants())
                .filter(e -> e.name().equalsIgnoreCase(value))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException(
                        "Giá trị không hợp lệ: " + value
                ));
        }

    private void validateCustomerOwner(Integer customerId, Integer userId) {
        if (userId == null) {
            throw new com.autowash.backend.common.exception.BusinessException(
                    "Yêu cầu xác thực người dùng",
                    org.springframework.http.HttpStatus.FORBIDDEN
            );
        }

        com.autowash.backend.user.entity.User user = userRepository.findById(userId)
                .orElseThrow(() -> new com.autowash.backend.common.exception.BusinessException(
                        "Không tìm thấy tài khoản người dùng",
                        org.springframework.http.HttpStatus.FORBIDDEN
                ));

        String role = user.getRole();
        if ("admin".equalsIgnoreCase(role) || "staff".equalsIgnoreCase(role)) {
            return;
        }

        com.autowash.backend.customer.entity.Customer authenticatedCustomer = customerRepository.findByUser_Id(userId)
                .orElseThrow(() -> new com.autowash.backend.common.exception.BusinessException(
                        "Không tìm thấy khách hàng ứng với tài khoản đăng nhập",
                        org.springframework.http.HttpStatus.FORBIDDEN
                ));

        if (!authenticatedCustomer.getCustomerId().equals(customerId)) {
            throw new com.autowash.backend.common.exception.BusinessException(
                    "Bạn không có quyền thao tác với dữ liệu của khách hàng khác",
                    org.springframework.http.HttpStatus.FORBIDDEN
            );
        }
    }
}