package com.autowash.backend.booking.repository;

import com.autowash.backend.booking.entity.BookingDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BookingDetailRepository extends JpaRepository<BookingDetail, Integer> {

    List<BookingDetail> findByBooking_BookingId(Integer bookingId);

    @org.springframework.data.jpa.repository.Query("SELECT bd FROM BookingDetail bd JOIN FETCH bd.service WHERE bd.booking.bookingId = :bookingId")
    List<BookingDetail> findByBookingIdWithService(@org.springframework.data.repository.query.Param("bookingId") Integer bookingId);
}