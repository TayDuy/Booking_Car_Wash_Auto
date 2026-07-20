package com.autowash.backend.employee.controller;

import com.autowash.backend.booking.enums.BookingStatus;
import com.autowash.backend.employee.dto.EmployeeBookingCreateRequestDTO;
import com.autowash.backend.employee.dto.EmployeeProfileResponseDTO;
import com.autowash.backend.employee.dto.EmployeeQueueBookingResponseDTO;
import com.autowash.backend.employee.service.EmployeeService;
import com.autowash.backend.payment.dto.PaymentResponseDTO;
import com.autowash.backend.security.CustomUserDetails;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/v1/employee")
@RequiredArgsConstructor
@Validated
@PreAuthorize("hasRole('EMPLOYEE')")
public class EmployeeController {

    private final EmployeeService employeeService;

    @GetMapping("/profile")
    public ResponseEntity<EmployeeProfileResponseDTO> getMyProfile(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return ResponseEntity.ok(
                employeeService.getMyProfile(userDetails.getId())
        );
    }

    @GetMapping("/queue")
    public ResponseEntity<Page<EmployeeQueueBookingResponseDTO>> getMyBranchQueue(
            @AuthenticationPrincipal CustomUserDetails userDetails,

            @RequestParam(required = false, name = "date")
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate date,

            @RequestParam(required = false, name = "status")
            BookingStatus status,

            @RequestParam(defaultValue = "0", name = "page")
            @Min(value = 0, message = "page không được nhỏ hơn 0")
            int page,

            @RequestParam(defaultValue = "9", name = "size")
            @Min(value = 1, message = "size phải lớn hơn 0")
            @Max(value = 100, message = "size không được vượt quá 100")
            int size
    ) {
        PageRequest pageable = PageRequest.of(page, size);

        return ResponseEntity.ok(
                employeeService.getMyBranchQueue(
                        userDetails.getId(),
                        date,
                        status,
                        pageable
                )
        );
    }

    @GetMapping("/bookings/{bookingId}")
    public ResponseEntity<EmployeeQueueBookingResponseDTO> getBookingById(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable("bookingId") Integer bookingId
    ) {
        return ResponseEntity.ok(
                employeeService.getMyBranchBookingById(
                        userDetails.getId(),
                        bookingId
                )
        );
    }

    @GetMapping("/bookings/search")
    public ResponseEntity<EmployeeQueueBookingResponseDTO> searchBooking(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam(name = "bookingCode") String bookingCode

    ) {
        return ResponseEntity.ok(
                employeeService.findMyBranchBookingByCode(
                        userDetails.getId(),
                        bookingCode
                )
        );
    }

    @PostMapping("/bookings")
    public ResponseEntity<EmployeeQueueBookingResponseDTO>
    createBookingForCustomer(
            @Valid @RequestBody
            EmployeeBookingCreateRequestDTO request,

            @AuthenticationPrincipal
            CustomUserDetails userDetails
    ) {
        EmployeeQueueBookingResponseDTO response =
                employeeService.createBookingForCustomer(
                        userDetails.getId(),
                        request
                );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    @PatchMapping("/bookings/{bookingId}/confirm")
    public ResponseEntity<EmployeeQueueBookingResponseDTO> confirmBooking(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable("bookingId") Integer bookingId
    ) {
        return ResponseEntity.ok(
                employeeService.confirmBooking(
                        userDetails.getId(),
                        bookingId
                )
        );
    }

    @PatchMapping("/bookings/{bookingId}/check-in")
    public ResponseEntity<EmployeeQueueBookingResponseDTO> checkInBooking(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable("bookingId") Integer bookingId
    ) {
        return ResponseEntity.ok(
                employeeService.checkInBooking(
                        userDetails.getId(),
                        bookingId
                )
        );
    }

    @PatchMapping("/bookings/{bookingId}/start-wash")
    public ResponseEntity<EmployeeQueueBookingResponseDTO> startWash(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable("bookingId") Integer bookingId,
            @RequestParam(required = false, name = "bayId") Integer bayId
    ) {
        return ResponseEntity.ok(
                employeeService.startWash(
                        userDetails.getId(),
                        bookingId,
                        bayId
                )
        );
    }

    @PatchMapping("/bookings/{bookingId}/complete")
    public ResponseEntity<EmployeeQueueBookingResponseDTO> completeWash(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable("bookingId") Integer bookingId
    ) {
        return ResponseEntity.ok(
                employeeService.completeWash(
                        userDetails.getId(),
                        bookingId
                )
        );
    }

    @PatchMapping("/bookings/{bookingId}/collect-cash-payment")
    public ResponseEntity<EmployeeQueueBookingResponseDTO> collectCashPayment(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable("bookingId") Integer bookingId
    ) {
        return ResponseEntity.ok(
                employeeService.collectCashPayment(
                        userDetails.getId(),
                        bookingId
                )
        );
    }

    @PostMapping("/bookings/{bookingId}/online-payment")
    public ResponseEntity<PaymentResponseDTO> createOnlinePayment(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable("bookingId") Integer bookingId
    ) {
        return ResponseEntity.ok(
                employeeService.ensureOnlinePayment(
                        userDetails.getId(),
                        bookingId
                )
        );
    }

    @GetMapping("/bookings/{bookingId}/online-payment/vnpay-qr")
    public ResponseEntity<byte[]> getOnlinePaymentQr(
            HttpServletRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable("bookingId") Integer bookingId
    ) throws Exception {
        byte[] qrImage = employeeService.generateOnlinePaymentQr(
                userDetails.getId(),
                bookingId,
                request
        );

        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_PNG)
                .body(qrImage);
    }
}