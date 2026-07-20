package com.autowash.backend.rating.repository;

import com.autowash.backend.rating.entity.BookingRating;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BookingRatingRepository extends JpaRepository<BookingRating, Integer> {

    Optional<BookingRating> findByBooking_BookingId(Integer bookingId);

    boolean existsByBooking_BookingId(Integer bookingId);

    List<BookingRating> findByCustomer_CustomerId(Integer customerId);

    List<BookingRating> findAllByOrderByCreatedAtDesc();
}
