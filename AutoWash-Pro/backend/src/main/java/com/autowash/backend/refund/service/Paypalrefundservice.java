// backend/src/main/java/com/autowash/backend/refund/service/PaypalRefundService.java
package com.autowash.backend.refund.service;

import java.math.BigDecimal;

/**
 * Gọi PayPal Refund API để hoàn tiền thật cho một capture đã thanh toán.
 * Dùng khi refund.refundMethod = original_payment_method và payment.paymentMethod = paypal.
 */
public interface PaypalRefundService {

    /**
     * Hoàn tiền cho một PayPal capture.
     *
     * @param captureId id capture đã lưu ở payment.paypal_capture_id lúc thanh toán thành công
     * @param amount    số tiền cần hoàn (phải <= số tiền đã capture)
     * @return id của refund transaction do PayPal trả về (paypal refund id), dùng để lưu vết/tra soát
     * @throws RuntimeException nếu gọi PayPal thất bại (lỗi mạng, capture không tồn tại, đã refund hết, v.v.)
     */
    String refundCapture(String captureId, BigDecimal amount);
}