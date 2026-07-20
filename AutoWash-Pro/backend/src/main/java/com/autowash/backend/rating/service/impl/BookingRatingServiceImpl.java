package com.autowash.backend.rating.service.impl;

import com.autowash.backend.booking.entity.Booking;
import com.autowash.backend.booking.enums.BookingStatus;
import com.autowash.backend.booking.repository.BookingRepository;
import com.autowash.backend.common.exception.BusinessException;
import com.autowash.backend.customer.entity.Customer;
import com.autowash.backend.customer.repository.CustomerRepository;
import com.autowash.backend.notification.entity.Notification;
import com.autowash.backend.notification.repository.NotificationRepository;
import com.autowash.backend.rating.dto.BookingRatingCreateRequestDTO;
import com.autowash.backend.rating.dto.BookingRatingResponseDTO;
import com.autowash.backend.rating.entity.BookingRating;
import com.autowash.backend.rating.repository.BookingRatingRepository;
import com.autowash.backend.rating.service.BookingRatingService;
import com.autowash.backend.user.entity.User;
import com.autowash.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.autowash.backend.rating.dto.AdminBookingRatingResponseDTO;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class BookingRatingServiceImpl implements BookingRatingService {

    private final BookingRatingRepository bookingRatingRepository;
    private final BookingRepository bookingRepository;
    private final CustomerRepository customerRepository;
    private final UserRepository userRepository;
    private final com.autowash.backend.notification.service.NotificationHelperService notificationHelperService;

    @Override
    @Transactional
    public BookingRatingResponseDTO createRating(Integer bookingId, BookingRatingCreateRequestDTO dto, Integer userId) {
        log.info("Creating rating for bookingId={}, userId={}, stars={}", bookingId, userId, dto.getRatingStars());

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new BusinessException("Không tìm thấy đơn đặt lịch id = " + bookingId));

        if (!BookingStatus.completed.equals(booking.getStatus())) {
            throw new BusinessException("Chỉ có thể đánh giá đơn đặt lịch đã hoàn thành");
        }

        Customer customer = booking.getCustomer();
        if (customer == null && userId != null) {
            customer = customerRepository.findByUser_Id(userId).orElse(null);
        }

        // Validate Ownership (IDOR Prevention)
        if (userId != null) {
            Customer currentCustomer = customerRepository.findByUser_Id(userId).orElse(null);
            if (currentCustomer != null) {
                if (customer != null && !customer.getCustomerId().equals(currentCustomer.getCustomerId())) {
                    User currentUser = userRepository.findById(userId).orElse(null);
                    boolean isStaffOrAdmin = currentUser != null && ("admin".equalsIgnoreCase(currentUser.getRole()) || "staff".equalsIgnoreCase(currentUser.getRole()));
                    if (!isStaffOrAdmin) {
                        throw new BusinessException("Bạn không có quyền đánh giá đơn đặt lịch này", HttpStatus.FORBIDDEN);
                    }
                }
            }
        }

        if (customer == null) {
            throw new BusinessException("Không tìm thấy thông tin khách hàng cho đơn đặt lịch này");
        }

        if (bookingRatingRepository.existsByBooking_BookingId(bookingId)) {
            throw new BusinessException("Đơn đặt lịch này đã được đánh giá rồi");
        }

        BookingRating rating = BookingRating.builder()
                .booking(booking)
                .customer(customer)
                .ratingStars(dto.getRatingStars())
                .comment(dto.getComment())
                .build();

        BookingRating savedRating = bookingRatingRepository.save(rating);

        // Notify Admin & Staff if rating is low (< 3 stars)
        if (dto.getRatingStars() < 3) {
            sendLowRatingAlert(booking, customer, dto.getRatingStars(), dto.getComment());
        }

        return toResponseDTO(savedRating);
    }

    @Override
    @Transactional(readOnly = true)
    public BookingRatingResponseDTO getRatingByBooking(Integer bookingId, Integer userId) {
        BookingRating rating = bookingRatingRepository.findByBooking_BookingId(bookingId).orElse(null);
        if (rating == null) {
            return null; // Return null if not rated yet to avoid 404 console error spam
        }

        // IDOR Check
        if (userId != null) {
            User currentUser = userRepository.findById(userId).orElse(null);
            boolean isStaffOrAdmin = currentUser != null && ("admin".equalsIgnoreCase(currentUser.getRole()) || "staff".equalsIgnoreCase(currentUser.getRole()));
            if (!isStaffOrAdmin) {
                Customer currentCustomer = customerRepository.findByUser_Id(userId).orElse(null);
                if (currentCustomer == null || (rating.getCustomer() != null && !rating.getCustomer().getCustomerId().equals(currentCustomer.getCustomerId()))) {
                    throw new BusinessException("Bạn không có quyền xem đánh giá này", HttpStatus.FORBIDDEN);
                }
            }
        }

        return toResponseDTO(rating);
    }

    private void sendLowRatingAlert(Booking booking, Customer customer, Integer stars, String comment) {
        List<User> targetUsers = userRepository.findByRoleIn(List.of("admin", "staff"));
        String customerName = (customer != null && customer.getFullName() != null) ? customer.getFullName() : "Khách hàng";
        String title = "CẢNH BÁO: Đánh giá kém (" + stars + " sao)";
        String body = "Khách hàng " + customerName + " vừa đánh giá " + stars + " sao cho đơn " + booking.getBookingCode()
                + (comment != null && !comment.isBlank() ? (": " + comment) : "");

        for (User user : targetUsers) {
            if (user == null || user.getId() == null) continue;
            notificationHelperService.sendNotificationSafely(user.getId(), Notification.NotificationType.RATING_ALERT, title, body, booking.getBookingId(), "booking");
        }
        log.info("Sent real-time low-rating alert notification to {} admin/staff users", targetUsers.size());
    }

    @Override
    @Transactional(readOnly = true)
    public List<AdminBookingRatingResponseDTO> getAllRatingsForAdmin(Integer stars, String search) {
        List<BookingRating> list = bookingRatingRepository.findAllByOrderByCreatedAtDesc();
        return list.stream()
                .filter(r -> stars == null || r.getRatingStars().equals(stars))
                .filter(r -> {
                    if (search == null || search.isBlank()) return true;
                    String s = search.trim().toLowerCase();
                    String code = r.getBooking() != null && r.getBooking().getBookingCode() != null ? r.getBooking().getBookingCode().toLowerCase() : "";
                    String name = r.getCustomer() != null && r.getCustomer().getFullName() != null ? r.getCustomer().getFullName().toLowerCase() : "";
                    String phone = r.getCustomer() != null && r.getCustomer().getPhone() != null ? r.getCustomer().getPhone().toLowerCase() : "";
                    String comment = r.getComment() != null ? r.getComment().toLowerCase() : "";
                    return code.contains(s) || name.contains(s) || phone.contains(s) || comment.contains(s);
                })
                .map(r -> AdminBookingRatingResponseDTO.builder()
                        .ratingId(r.getRatingId())
                        .bookingId(r.getBooking() != null ? r.getBooking().getBookingId() : null)
                        .bookingCode(r.getBooking() != null ? r.getBooking().getBookingCode() : null)
                        .customerId(r.getCustomer() != null ? r.getCustomer().getCustomerId() : null)
                        .customerName(r.getCustomer() != null ? r.getCustomer().getFullName() : "Khách hàng")
                        .customerPhone(r.getCustomer() != null ? r.getCustomer().getPhone() : "")
                        .customerEmail(r.getCustomer() != null ? r.getCustomer().getEmail() : "")
                        .ratingStars(r.getRatingStars())
                        .comment(r.getComment())
                        .createdAt(r.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
    }

    private BookingRatingResponseDTO toResponseDTO(BookingRating rating) {
        if (rating == null) return null;
        return BookingRatingResponseDTO.builder()
                .ratingId(rating.getRatingId())
                .bookingId(rating.getBooking() != null ? rating.getBooking().getBookingId() : null)
                .bookingCode(rating.getBooking() != null ? rating.getBooking().getBookingCode() : null)
                .customerId(rating.getCustomer() != null ? rating.getCustomer().getCustomerId() : null)
                .customerName(rating.getCustomer() != null ? rating.getCustomer().getFullName() : null)
                .ratingStars(rating.getRatingStars())
                .comment(rating.getComment())
                .createdAt(rating.getCreatedAt())
                .build();
    }
}
