package com.autowash.backend.booking.service.impl;

import com.autowash.backend.booking.dto.BookingDetailItemResponseDTO;
import com.autowash.backend.booking.dto.BookingDetailRequestDTO;
import com.autowash.backend.booking.entity.Booking;
import com.autowash.backend.booking.entity.Booking.BookingStatus;
import com.autowash.backend.booking.entity.BookingDetail;
import com.autowash.backend.booking.repository.BookingDetailRepository;
import com.autowash.backend.booking.repository.BookingRepository;
import com.autowash.backend.booking.service.BookingDetailService;
import com.autowash.backend.common.exception.BusinessException;
import com.autowash.backend.common.exception.ResourceNotFoundException;
import com.autowash.backend.servicepackage.entity.ServicePackage;
import com.autowash.backend.servicepackage.repository.ServicePackageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

/**
 * Service xử lý các nghiệp vụ liên quan đến Booking Detail.
 *
 * Chức năng:
 * - Thêm dịch vụ vào booking
 * - Lấy danh sách dịch vụ của booking
 * - Lấy chi tiết booking detail
 * - Xóa dịch vụ khỏi booking
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class BookingDetailServiceImpl implements BookingDetailService {

    private final BookingDetailRepository bookingDetailRepository;
    private final BookingRepository bookingRepository;
    private final ServicePackageRepository servicePackageRepository;

    /**
     * Thêm dịch vụ vào booking.
     *
     * @param bookingId ID của booking cần thêm dịch vụ
     * @param request   DTO chứa thông tin dịch vụ cần thêm (serviceId, quantity)
     * @return BookingDetailItemResponseDTO chứa thông tin chi tiết vừa được thêm
     * @throws ResourceNotFoundException nếu không tìm thấy booking hoặc service
     * @throws BusinessException         nếu booking đang ở trạng thái không cho phép chỉnh sửa
     *                                   hoặc dịch vụ không còn hoạt động
     */
    @Override
    @Transactional
    public BookingDetailItemResponseDTO addDetail(
            Integer bookingId,
            BookingDetailRequestDTO request) {

        // Tìm booking theo id, ném exception nếu không tồn tại
        Booking booking = findBookingOrThrow(bookingId);

        // Kiểm tra booking có đang ở trạng thái cho phép chỉnh sửa không
        validateBookingEditable(booking);

        // Tìm gói dịch vụ theo serviceId, ném exception nếu không tồn tại
        ServicePackage servicePackage =
                servicePackageRepository.findById(request.getServiceId())
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "ServicePackage", "id", request.getServiceId()));

        // Kiểm tra dịch vụ có đang hoạt động không
        if (!Boolean.TRUE.equals(servicePackage.getIsActive())) {
            throw new BusinessException(
                    "Dịch vụ này hiện không còn hoạt động");
        }

        // Nếu quantity không hợp lệ (null hoặc <= 0) thì mặc định là 1
        int quantity =
                (request.getQuantity() != null
                        && request.getQuantity() > 0)
                        ? request.getQuantity()
                        : 1;

        // Lấy đơn giá từ gói dịch vụ
        BigDecimal unitPrice = servicePackage.getBasePrice();

        // Tính thành tiền = đơn giá x số lượng
        BigDecimal subTotal =
                unitPrice.multiply(BigDecimal.valueOf(quantity));

        // Tạo mới BookingDetail và lưu vào database
        BookingDetail detail = BookingDetail.builder()
                .booking(booking)
                .service(servicePackage)
                .quantity(quantity)
                .unitPrice(unitPrice)
                .subTotal(subTotal)
                .build();

        detail = bookingDetailRepository.save(detail);

        // Chuyển đổi entity sang DTO và trả về
        return BookingDetailItemResponseDTO.from(detail);
    }

    /**
     * Lấy danh sách tất cả dịch vụ theo booking id.
     *
     * @param bookingId ID của booking cần lấy danh sách dịch vụ
     * @return Danh sách BookingDetailItemResponseDTO
     * @throws ResourceNotFoundException nếu không tìm thấy booking
     */
    @Override
    @Transactional(readOnly = true)
    public List<BookingDetailItemResponseDTO> getByBookingId(
            Integer bookingId) {

        // Kiểm tra booking có tồn tại không trước khi truy vấn detail
        findBookingOrThrow(bookingId);

        // Lấy tất cả detail theo bookingId, map sang DTO và trả về
        return bookingDetailRepository
                .findByBooking_BookingId(bookingId)
                .stream()
                .map(BookingDetailItemResponseDTO::from)
                .toList();
    }

    /**
     * Lấy chi tiết một booking detail theo id.
     *
     * @param detailId ID của booking detail cần lấy
     * @return BookingDetailItemResponseDTO chứa thông tin chi tiết
     * @throws ResourceNotFoundException nếu không tìm thấy booking detail
     */
    @Override
    @Transactional(readOnly = true)
    public BookingDetailItemResponseDTO getById(Integer detailId) {

        // Tìm booking detail theo id, ném exception nếu không tồn tại
        BookingDetail detail =
                bookingDetailRepository.findById(detailId)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "BookingDetail", "id", detailId));

        // Chuyển đổi entity sang DTO và trả về
        return BookingDetailItemResponseDTO.from(detail);
    }

    /**
     * Xóa một booking detail theo id.
     *
     * @param detailId ID của booking detail cần xóa
     * @throws ResourceNotFoundException nếu không tìm thấy booking detail
     * @throws BusinessException         nếu booking đang ở trạng thái không cho phép chỉnh sửa
     */
    @Override
    @Transactional
    public void removeDetail(Integer detailId) {

        // Tìm booking detail theo id, ném exception nếu không tồn tại
        BookingDetail detail =
                bookingDetailRepository.findById(detailId)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "BookingDetail", "id", detailId));

        // Kiểm tra booking cha có đang ở trạng thái cho phép chỉnh sửa không
        validateBookingEditable(detail.getBooking());

        // Xóa booking detail khỏi database
        bookingDetailRepository.delete(detail);
    }

    /**
     * Kiểm tra booking có được phép chỉnh sửa hay không.
     * Booking ở trạng thái in_progress hoặc completed sẽ không cho phép chỉnh sửa.
     *
     * @param booking Booking cần kiểm tra
     * @throws BusinessException nếu booking đang ở trạng thái in_progress hoặc completed
     */
    private void validateBookingEditable(Booking booking) {

        // Không cho phép chỉnh sửa nếu booking đang xử lý hoặc đã hoàn thành
        if (BookingStatus.in_progress.equals(booking.getStatus())
                || BookingStatus.completed.equals(booking.getStatus())) {

            throw new BusinessException(
                    "Không thể chỉnh sửa dịch vụ khi booking đang ở trạng thái: "
                            + booking.getStatus());
        }
    }

    /**
     * Tìm booking theo id, ném exception nếu không tồn tại.
     *
     * @param bookingId ID của booking cần tìm
     * @return Booking entity tương ứng
     * @throws ResourceNotFoundException nếu không tìm thấy booking
     */
    private Booking findBookingOrThrow(Integer bookingId) {

        // Truy vấn database, nếu không có thì ném ResourceNotFoundException
        return bookingRepository.findById(bookingId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Booking", "id", bookingId));
    }
}