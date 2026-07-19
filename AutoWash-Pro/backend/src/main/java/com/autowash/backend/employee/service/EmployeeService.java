package com.autowash.backend.employee.service;

import com.autowash.backend.booking.enums.BookingStatus;
import com.autowash.backend.employee.dto.EmployeeBookingCreateRequestDTO;
import com.autowash.backend.employee.dto.EmployeeProfileResponseDTO;
import com.autowash.backend.employee.dto.EmployeeQueueBookingResponseDTO;
import com.autowash.backend.payment.dto.PaymentResponseDTO;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.List;

/**
 * Nghiệp vụ dành cho tài khoản Employee.
 *
 * Mọi thao tác booking đều phải:
 * - Xác định Employee từ userId đăng nhập.
 * - Giới hạn trong chi nhánh của Employee.
 * - Kiểm tra trạng thái Employee.
 */
public interface EmployeeService {

    // =========================================================
    // PROFILE
    // =========================================================

    /**
     * Lấy hồ sơ Employee đang đăng nhập.
     */
    EmployeeProfileResponseDTO getMyProfile(Integer userId);

    // =========================================================
    // QUEUE
    // =========================================================

    /**
     * Lấy hàng chờ booking thuộc chi nhánh của Employee.
     *
     * date null:
     * - Mặc định lấy ngày hiện tại tại implementation.
     *
     * status null:
     * - Lấy tất cả trạng thái nằm trong hàng chờ vận hành.
     */
    List<EmployeeQueueBookingResponseDTO> getMyBranchQueue(
            Integer userId,
            LocalDate date,
            BookingStatus status
    );

    /**
     * Lấy hàng chờ có phân trang.
     *
     * Implementation hiện tại có thể tiếp tục dùng hàm List phía trên.
     * EmployeeServiceImpl sẽ override phương thức này khi BookingRepository
     * hỗ trợ phân trang trực tiếp bằng Pageable.
     */
    default Page<EmployeeQueueBookingResponseDTO> getMyBranchQueue(
            Integer userId,
            LocalDate date,
            BookingStatus status,
            Pageable pageable
    ) {
        List<EmployeeQueueBookingResponseDTO> queue =
                getMyBranchQueue(userId, date, status);

        if (pageable == null || pageable.isUnpaged()) {
            return new PageImpl<>(queue);
        }

        long offset = pageable.getOffset();
        int fromIndex = offset >= queue.size()
                ? queue.size()
                : (int) offset;
        int toIndex = Math.min(
                fromIndex + pageable.getPageSize(),
                queue.size()
        );

        return new PageImpl<>(
                queue.subList(fromIndex, toIndex),
                pageable,
                queue.size()
        );
    }

    /**
     * Xem chi tiết một booking thuộc chi nhánh Employee.
     */
    EmployeeQueueBookingResponseDTO getMyBranchBookingById(
            Integer userId,
            Integer bookingId
    );

    /**
     * Tìm booking theo bookingCode trong chi nhánh Employee.
     */
    EmployeeQueueBookingResponseDTO findMyBranchBookingByCode(
            Integer userId,
            String bookingCode
    );

    // =========================================================
    // CREATE BOOKING FOR CUSTOMER
    // =========================================================

    /**
     * Employee tạo booking hộ khách tại quầy.
     *
     * Hỗ trợ:
     * - Khách đã có customerId.
     * - Khách vãng lai chưa có tài khoản.
     *
     * Chi nhánh không lấy từ request.
     * Backend tự lấy từ Employee đang đăng nhập.
     *
     * Slot phải thuộc cùng chi nhánh với Employee.
     */
    EmployeeQueueBookingResponseDTO createBookingForCustomer(
            Integer userId,
            EmployeeBookingCreateRequestDTO request
    );

    // =========================================================
    // CONFIRM
    // pending -> confirmed
    // =========================================================

    /**
     * Xác nhận booking.
     *
     * Chỉ Employee có role supervisor hoặc manager.
     */
    EmployeeQueueBookingResponseDTO confirmBooking(
            Integer userId,
            Integer bookingId
    );

    // =========================================================
    // CHECK-IN
    // confirmed -> checked_in
    // =========================================================

    /**
     * Check-in xe khi khách đến chi nhánh.
     */
    EmployeeQueueBookingResponseDTO checkInBooking(
            Integer userId,
            Integer bookingId
    );

    // =========================================================
    // START WASH
    // checked_in -> in_progress
    // =========================================================

    /**
     * Bắt đầu rửa xe.
     *
     * Đồng thời:
     * - Gán Employee vào assignedStaff.
     * - Chuyển WashBay sang occupied.
     */
    EmployeeQueueBookingResponseDTO startWash(
            Integer userId,
            Integer bookingId,
            Integer bayId
    );

    // =========================================================
    // COMPLETE
    // in_progress -> completed
    // =========================================================

    /**
     * Hoàn thành quá trình rửa xe.
     *
     * Đồng thời:
     * - Ghi completeAt.
     * - Trả WashBay về available.
     *
     * Không cộng điểm loyalty tại đây.
     */
    EmployeeQueueBookingResponseDTO completeWash(
            Integer userId,
            Integer bookingId
    );

    // =========================================================
    // PAYMENT — thanh toán tại trạm
    // =========================================================

    /**
     * Thu tiền mặt tại quầy cho một booking đã completed.
     *
     * Tạo (hoặc tái sử dụng) Payment với paymentMethod = cash,
     * sau đó chuyển ngay sang paid — kích hoạt cộng điểm loyalty.
     *
     * Booking phải thuộc chi nhánh của Employee và đang ở
     * trạng thái completed, chưa có payment nào ở trạng thái paid.
     */
    EmployeeQueueBookingResponseDTO collectCashPayment(
            Integer userId,
            Integer bookingId
    );

    /**
     * Tạo (hoặc lấy lại nếu đã tồn tại và chưa paid) yêu cầu thanh toán
     * online (VNPay) cho một booking đã completed, dùng khi khách vãng lai
     * muốn quét QR thanh toán ngay tại quầy thay vì trả tiền mặt.
     *
     * Không yêu cầu khách phải có tài khoản đăng nhập — payment được tạo
     * dựa trên bookingId, khách chỉ cần quét QR bằng app ngân hàng của họ.
     */
    PaymentResponseDTO ensureOnlinePayment(
            Integer userId,
            Integer bookingId
    );

    /**
     * Sinh ảnh QR (PNG) cho yêu cầu thanh toán online của một booking.
     *
     * Tự động tạo payment nếu chưa có (xem {@link #ensureOnlinePayment}).
     * VNPay sẽ callback về /api/v1/payments/vnpay-return và
     * /api/v1/payments/vnpay-ipn (không đổi, dùng chung cho cả 2 luồng
     * customer tự thanh toán và employee thu hộ tại quầy).
     */
    byte[] generateOnlinePaymentQr(
            Integer userId,
            Integer bookingId,
            HttpServletRequest request
    ) throws Exception;
}