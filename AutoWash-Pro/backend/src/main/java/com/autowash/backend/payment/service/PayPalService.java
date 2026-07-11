package com.autowash.backend.payment.service;

import java.math.BigDecimal;
import java.util.Map;

/**
 * Giao tiếp với PayPal REST API (Checkout Orders v2) để tạo và chốt (capture)
 * giao dịch thanh toán quốc tế qua PayPal.
 */
public interface PayPalService {

    /**
     * Tạo một PayPal Order (intent = CAPTURE).
     * Số tiền VND sẽ được tự động quy đổi sang USD (hoặc đơn vị cấu hình ở
     * app.paypal.currency) theo tỉ giá hiện tại trước khi gửi cho PayPal.
     *
     * @param amountVnd   số tiền cần thanh toán, tính theo VND (finalAmount của Payment)
     * @param paymentId   id payment nội bộ — dùng làm reference_id/custom_id để đối chiếu khi capture
     * @param description mô tả đơn hàng hiển thị trên trang thanh toán PayPal
     * @return map gồm "orderId" (PayPal order id), "approvalUrl" (link redirect khách sang PayPal),
     *         "amountUsd" (số tiền quy đổi thực tế đã gửi cho PayPal)
     */
    Map<String, String> createOrder(BigDecimal amountVnd, Integer paymentId, String description);

    /**
     * Capture (chốt) một order mà khách đã approve bên phía PayPal.
     * Gọi khi PayPal redirect trình duyệt về app.paypal.return-url kèm ?token={orderId}.
     *
     * @param orderId id order PayPal (query param "token")
     * @return map gồm "status" (COMPLETED/khác), "captureId", "payerEmail"
     */
    Map<String, String> captureOrder(String orderId);
}