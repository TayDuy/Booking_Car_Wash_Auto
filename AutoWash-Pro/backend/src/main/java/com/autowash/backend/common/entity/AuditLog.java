package com.autowash.backend.common.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "audit_log")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    // Hành động gì đã xảy ra? Ví dụ: "CHANGE_ROLE"
    @Column(nullable = false)
    private String action;

    // Ai đã thực hiện hành động? Lưu username của Admin
    @Column(nullable = false)
    private String performedBy;

    //ID của user bị thay đổi (khách hàng nào bị sửa quyền)
    private Integer targetUserId;

    //chi tiết cụ thể. ví dụ: "customer -> admin"
    private String details;

    //Thời gian xảy ra, tự động lấy thời gian hiện tại khi tạo
    @Column(nullable = false)
    private LocalDateTime timestamp = LocalDateTime.now();

}
