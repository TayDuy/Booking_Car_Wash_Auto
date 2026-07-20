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

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class BookingRatingServiceImpl implements BookingRatingService {

    private final BookingRatingRepository bookingRatingRepository;
    private final BookingRepository bookingRepository;
    private final CustomerRepository customerRepository;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;
    private final com.autowash.backend.notification.service.NotificationService notificationService;

    @Override
    @Transactional
    public BookingRatingResponseDTO createRating(Integer bookingId, BookingRatingCreateRequestDTO dto, Integer userId) {
        log.info("Creating rating for bookingId={}, userId={}, stars={}", bookingId, userId, dto.getRatingStars());

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new BusinessException("Không tìm thấy đơn đặt lịch id = " + bookingId));

        if (!BookingStatus.completed.equals(booking.getStatus())) {
            throw new BusinessException("Chỉ có thể đánh giá đơn đặt lịch đã hoàn thành");
        }

        // Validate Ownership (IDOR Prevention)
        if (userId != null) {
            Customer currentCustomer = customerRepository.findByUser_Id(userId)
                    .orElseThrow(() -> new BusinessException("Không tìm thấy hồ sơ khách hàng của bạn", HttpStatus.FORBIDDEN));

            if (booking.getCustomer() == null || !booking.getCustomer().getCustomerId().equals(currentCustomer.getCustomerId())) {
                User currentUser = userRepository.findById(userId).orElse(null);
                boolean isStaffOrAdmin = currentUser != null && ("admin".equalsIgnoreCase(currentUser.getRole()) || "staff".equalsIgnoreCase(currentUser.getRole()));
                if (!isStaffOrAdmin) {
                    throw new BusinessException("Bạn không có quyền đánh giá đơn đặt lịch này", HttpStatus.FORBIDDEN);
                }
            }
        }

        if (bookingRatingRepository.existsByBooking_BookingId(bookingId)) {
            throw new BusinessException("Đơn đặt lịch này đã được đánh giá rồi");
        }

        Customer customer = booking.getCustomer();

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
        BookingRating rating = bookingRatingRepository.findByBooking_BookingId(bookingId)
                .orElseThrow(() -> new BusinessException("Chưa có đánh giá cho đơn đặt lịch id = " + bookingId));

        // IDOR Check
        if (userId != null) {
            User currentUser = userRepository.findById(userId).orElse(null);
            boolean isStaffOrAdmin = currentUser != null && ("admin".equalsIgnoreCase(currentUser.getRole()) || "staff".equalsIgnoreCase(currentUser.getRole()));
            if (!isStaffOrAdmin) {
                Customer currentCustomer = customerRepository.findByUser_Id(userId).orElse(null);
                if (currentCustomer == null || !rating.getCustomer().getCustomerId().equals(currentCustomer.getCustomerId())) {
                    throw new BusinessException("Bạn không có quyền xem đánh giá này", HttpStatus.FORBIDDEN);
                }
            }
        }

        return toResponseDTO(rating);
    }

    private void sendLowRatingAlert(Booking booking, Customer customer, Integer stars, String comment) {
        try {
            List<User> targetUsers = userRepository.findByRoleIn(List.of("admin", "staff"));
            String customerName = customer != null ? customer.getFullName() : "Khách hàng";
            String title = "CẢNH BÁO: Đánh giá kém (" + stars + " sao)";
            String body = "Khách hàng " + customerName + " vừa đánh giá " + stars + " sao cho đơn " + booking.getBookingCode()
                    + (comment != null && !comment.isBlank() ? (": " + comment) : "");

            for (User user : targetUsers) {
                com.autowash.backend.notification.dto.NotificationCreateDTO alertDto =
                        com.autowash.backend.notification.dto.NotificationCreateDTO.builder()
                                .userId(user.getId())
                                .type(Notification.NotificationType.RATING_ALERT)
                                .title(title)
                                .body(body)
                                .referenceId(booking.getBookingId())
                                .referenceType("booking")
                                .channel(Notification.NotificationChannel.in_app)
                                .build();

                notificationService.create(alertDto);
            }
            log.info("Sent real-time low-rating alert notification to {} admin/staff users", targetUsers.size());
        } catch (Exception e) {
            log.error("Failed to send low-rating alert notification", e);
        }
    }

    private BookingRatingResponseDTO toResponseDTO(BookingRating rating) {
        return BookingRatingResponseDTO.builder()
                .ratingId(rating.getRatingId())
                .bookingId(rating.getBooking().getBookingId())
                .bookingCode(rating.getBooking().getBookingCode())
                .customerId(rating.getCustomer().getCustomerId())
                .customerName(rating.getCustomer().getFullName())
                .ratingStars(rating.getRatingStars())
                .comment(rating.getComment())
                .createdAt(rating.getCreatedAt())
                .build();
    }
}
