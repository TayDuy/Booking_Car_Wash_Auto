package com.autowash.backend.reward.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
/*
    =>  Đây là thư viện validation.
        Nó giúp kiểm tra dữ liệu frontend gửi lên.
*/

public record RedeemRewardRequestDTO(
    /*
    Bắt frontend phải gửi nếu không có id thì báo lỗi
        {
           "customerId": 1
        }
    */
    @NotNull(message = "Yeu cau ID khach hang")
    Integer customerId,
    /*
        @NotBlank:
             Không được null
             Không được rỗng ""
             Không được toàn khoảng trắng "   "
                {
                    "vehicleType": "car"
                }
    */
    @NotBlank(message = "Yeu cau loai phuong tien")
    String vehicleType
) {
}
