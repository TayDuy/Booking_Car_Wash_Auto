package com.autowash.backend.payment.service;

import com.autowash.backend.payment.dto.PaymentCreateRequestDTO;
import com.autowash.backend.payment.dto.PaymentResponseDTO;

/**
 * Interface định nghĩa các nghiệp vụ liên quan đến thanh toán (Payment).
 * 
 * Quản lý toàn bộ vòng đời của một giao dịch thanh toán:
 * 1. Tạo mới thanh toán sau khi đặt lịch (booking) hoàn tất.
 * 2. Cập nhật trạng thái thanh toán (Thành công, Thất bại, Hủy).
 * 3. Tự động tính toán số tiền cần thanh toán dựa trên các dịch vụ, mã giảm giá, và điểm thưởng.
 */
public interface PaymentService {

    /**
     * Tạo một giao dịch thanh toán mới.
     * Dành cho các booking đã ở trạng thái completed.
     * 
     * @param request Chứa ID booking, mã giảm giá (nếu có), reward (nếu có), và phương thức thanh toán.
     * @return DTO chứa thông tin chi tiết của payment vừa tạo.
     */
    PaymentResponseDTO createPayment(
            PaymentCreateRequestDTO request);

    /**
     * Chuyển trạng thái thanh toán từ unpaid sang paid.
     * Đồng thời, hệ thống sẽ kích hoạt chức năng tích điểm thưởng (Loyalty Earn) cho khách hàng.
     * 
     * @param paymentId ID của payment cần xử lý.
     * @return DTO chứa thông tin chi tiết của payment sau khi đã cập nhật.
     */
    default PaymentResponseDTO processPayment(Integer paymentId) {
        return processPayment(paymentId, null, null, null, null);
    }

    PaymentResponseDTO processPayment(Integer paymentId, String transactionNo, String bankCode, String cardType, String responseCode);

    /**
     * Cập nhật trạng thái chung cho payment (có thể là paid, cancelled, hoặc failed).
     * 
     * @param paymentId ID của payment cần cập nhật.
     * @param request Chứa trạng thái mới cần cập nhật.
     * @return DTO chứa thông tin payment sau khi cập nhật.
     */
    PaymentResponseDTO updateStatus(Integer paymentId, com.autowash.backend.payment.dto.PaymentUpdateRequestDTO request);

    /**
     * Lấy danh sách các giao dịch thanh toán dựa trên trạng thái (ví dụ: chỉ lấy các giao dịch chưa thanh toán).
     * 
     * @param status Trạng thái cần lọc (có thể null để lấy tất cả).
     * @return Danh sách các payment phù hợp.
     */
    java.util.List<PaymentResponseDTO> getByStatus(com.autowash.backend.payment.entity.Payment.PaymentStatus status);

    /**
     * Hủy bỏ một giao dịch thanh toán (chuyển sang trạng thái cancelled).
     * Sẽ hoàn lại điểm thưởng nếu khách hàng đã sử dụng để đổi lấy giảm giá trong giao dịch này.
     * 
     * @param paymentId ID của payment cần hủy.
     * @return DTO chứa thông tin payment sau khi hủy.
     */
    PaymentResponseDTO cancelPayment(Integer paymentId);

    /**
     * Đánh dấu một giao dịch thanh toán là thất bại (chuyển sang trạng thái failed).
     * 
     * @param paymentId ID của payment cần đánh dấu thất bại.
     * @return DTO chứa thông tin payment sau khi cập nhật.
     */
    default PaymentResponseDTO markFailed(Integer paymentId) {
        return markFailed(paymentId, null, null, null, null);
    }

    PaymentResponseDTO markFailed(Integer paymentId, String transactionNo, String bankCode, String cardType, String responseCode);

    /**
     * Lấy thông tin chi tiết của một payment dựa trên ID của nó.
     * 
     * @param paymentId ID của payment.
     * @return DTO chứa thông tin chi tiết của payment.
     */
    PaymentResponseDTO getById(Integer paymentId);

    /**
     * Tìm kiếm thông tin payment dựa vào ID của Booking.
     * Mỗi Booking chỉ có duy nhất 1 payment tương ứng.
     * 
     * @param bookingId ID của Booking.
     * @return DTO chứa thông tin chi tiết của payment tương ứng.
     */
    PaymentResponseDTO getByBookingId(Integer bookingId);
}