package com.autowash.backend.customerreward.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CustomerRewardResponseDTO {
    private Integer customerRewardId;

    private Integer customerId;

    private Integer rewardId;

    private String rewardName;

    private String voucherCode;

    private String status;

    private Integer redeemedPoints;

    private Integer remainingPoints;

    private String discountType;

    private BigDecimal discountValue;

    private LocalDateTime redeemedAt;

    private LocalDateTime expriedAt;

    private LocalDateTime useAt;

    private Integer usedBookingId;
}
