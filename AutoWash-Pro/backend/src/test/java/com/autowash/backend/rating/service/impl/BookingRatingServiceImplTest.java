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
import com.autowash.backend.user.entity.User;
import com.autowash.backend.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BookingRatingServiceImplTest {

    @Mock
    private BookingRatingRepository bookingRatingRepository;

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private com.autowash.backend.notification.service.NotificationService notificationService;

    @InjectMocks
    private BookingRatingServiceImpl bookingRatingService;

    @Test
    void testCreateRatingSuccess() {
        BookingRatingCreateRequestDTO dto = new BookingRatingCreateRequestDTO(5, "Rất hài lòng");

        Customer customer = Customer.builder().customerId(10).fullName("Nguyễn Văn A").build();
        Booking booking = Booking.builder()
                .bookingId(100)
                .bookingCode("BK-20260720-001")
                .status(BookingStatus.completed)
                .customer(customer)
                .build();

        when(bookingRepository.findById(100)).thenReturn(Optional.of(booking));
        when(customerRepository.findByUser_Id(1)).thenReturn(Optional.of(customer));
        when(bookingRatingRepository.existsByBooking_BookingId(100)).thenReturn(false);

        BookingRating savedRating = BookingRating.builder()
                .ratingId(1)
                .booking(booking)
                .customer(customer)
                .ratingStars(5)
                .comment("Rất hài lòng")
                .build();

        when(bookingRatingRepository.save(any(BookingRating.class))).thenReturn(savedRating);

        BookingRatingResponseDTO response = bookingRatingService.createRating(100, dto, 1);

        assertNotNull(response);
        assertEquals(5, response.getRatingStars());
        assertEquals("Rất hài lòng", response.getComment());
        verify(notificationService, never()).create(any());
    }

    @Test
    void testCreateRatingLowStarsTriggersNotification() {
        BookingRatingCreateRequestDTO dto = new BookingRatingCreateRequestDTO(2, "Rửa xe chưa sạch");

        Customer customer = Customer.builder().customerId(10).fullName("Nguyễn Văn B").build();
        Booking booking = Booking.builder()
                .bookingId(101)
                .bookingCode("BK-20260720-002")
                .status(BookingStatus.completed)
                .customer(customer)
                .build();

        User adminUser = User.builder().id(99).role("admin").build();

        when(bookingRepository.findById(101)).thenReturn(Optional.of(booking));
        when(customerRepository.findByUser_Id(2)).thenReturn(Optional.of(customer));
        when(bookingRatingRepository.existsByBooking_BookingId(101)).thenReturn(false);
        when(userRepository.findByRoleIn(any())).thenReturn(List.of(adminUser));

        BookingRating savedRating = BookingRating.builder()
                .ratingId(2)
                .booking(booking)
                .customer(customer)
                .ratingStars(2)
                .comment("Rửa xe chưa sạch")
                .build();

        when(bookingRatingRepository.save(any(BookingRating.class))).thenReturn(savedRating);

        BookingRatingResponseDTO response = bookingRatingService.createRating(101, dto, 2);

        assertNotNull(response);
        assertEquals(2, response.getRatingStars());
        verify(notificationService, times(1)).create(any());
    }

    @Test
    void testCreateRatingIDORForbidden() {
        BookingRatingCreateRequestDTO dto = new BookingRatingCreateRequestDTO(4, "Tốt");

        Customer ownerCustomer = Customer.builder().customerId(10).build();
        Customer otherCustomer = Customer.builder().customerId(20).build();

        Booking booking = Booking.builder()
                .bookingId(102)
                .status(BookingStatus.completed)
                .customer(ownerCustomer)
                .build();

        User otherUser = User.builder().id(2).role("customer").build();

        when(bookingRepository.findById(102)).thenReturn(Optional.of(booking));
        when(customerRepository.findByUser_Id(2)).thenReturn(Optional.of(otherCustomer));
        when(userRepository.findById(2)).thenReturn(Optional.of(otherUser));

        BusinessException ex = assertThrows(BusinessException.class,
                () -> bookingRatingService.createRating(102, dto, 2));

        assertEquals(HttpStatus.FORBIDDEN, ex.getHttpStatus());
    }

    @Test
    void testCreateRatingInvalidStatusOrAlreadyRated() {
        BookingRatingCreateRequestDTO dto = new BookingRatingCreateRequestDTO(5, "Tuyệt vời");

        Booking uncompletedBooking = Booking.builder()
                .bookingId(103)
                .status(BookingStatus.confirmed)
                .build();

        when(bookingRepository.findById(103)).thenReturn(Optional.of(uncompletedBooking));

        assertThrows(BusinessException.class, () -> bookingRatingService.createRating(103, dto, 1));
    }
}
