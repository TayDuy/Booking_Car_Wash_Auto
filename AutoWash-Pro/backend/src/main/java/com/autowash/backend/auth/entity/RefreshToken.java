package com.autowash.backend.auth.entity;

import com.autowash.backend.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "refresh_tokens")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
@Builder
public class RefreshToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @OneToOne
    @JoinColumn(name = "user_id", referencedColumnName = "user_id", unique = true)
    private User user;

    //chuỗi token ngẫu nhiên, không được trùng lặp và không được phép null
    @Column(nullable = false, unique = true)
    private String token;

    @Column(nullable = false)
    private Instant expriryDate;//thời điểm token hết hạn (sau 7 ngày)

}
