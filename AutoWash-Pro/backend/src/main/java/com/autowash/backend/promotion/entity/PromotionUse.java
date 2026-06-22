package com.autowash.backend.promotion.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "promotion_use")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PromotionUse {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "promotion_use_id")
    private Integer promotionUseId;

    @Column(name = "promotion_id", nullable = false)
    private Integer promotionId;

    @Column(name = "customer_id", nullable = false)
    private Integer customerId;

    @Column(name = "order_value", nullable = false, precision = 12, scale = 2)
    private BigDecimal orderValue;

    @Column(name = "discount_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal discountAmount;

    @Column(name = "final_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal finalAmount;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private PromotionUseStatus status;

    @Column(name = "used_at", nullable = false)
    private LocalDateTime usedAt;

    @PrePersist
    public void prePersist() {
        if (status == null) {
            status = PromotionUseStatus.used;
        }

        if (usedAt == null) {
            usedAt = LocalDateTime.now();
        }
    }

    public enum PromotionUseStatus {
        used,
        cancelled
    }
}