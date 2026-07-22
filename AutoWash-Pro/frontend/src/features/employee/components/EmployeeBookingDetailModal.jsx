import { useCallback, useEffect, useState } from "react";
import employeeApi from "../../../api/employeeApi";
import BookingStatusBadge from "./BookingStatusBadge";
import "./EmployeeBookingDetailModal.css";

const unwrapResponse = (response) =>
    response?.data?.data ?? response?.data ?? null;

const getErrorMessage = (error) =>
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.response?.data?.data?.message ||
    "Không thể tải chi tiết booking.";

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("vi-VN").format(date);
};

const formatTime = (value) => {
  if (!value) return "—";
  return String(value).slice(0, 5);
};

const formatDateTime = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
};

const formatMoney = (value) => {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "0 ₫";
  }

  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatVehicleType = (value) => {
  const normalizedValue = String(value ?? "").toLowerCase();

  const labels = {
    car: "Xe 4 chỗ",
    suv: "Xe 7 chỗ",
  };

  return labels[normalizedValue] || value || "—";
};

function DetailItem({ label, value, fullWidth = false }) {
  return (
      <div
          className={`employee-detail-item ${
              fullWidth ? "employee-detail-item--full" : ""
          }`}
      >
        <span className="employee-detail-item__label">{label}</span>
        <strong className="employee-detail-item__value">
          {value ?? "—"}
        </strong>
      </div>
  );
}

function EmployeeBookingDetailModal({ open, bookingId, onClose }) {
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const loadBooking = useCallback(async () => {
    if (!bookingId) return;

    try {
      setLoading(true);
      setErrorMessage("");

      const response = await employeeApi.getBookingById(bookingId);
      setBooking(unwrapResponse(response));
    } catch (error) {
      setBooking(null);
      setErrorMessage(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    if (!open || !bookingId) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void loadBooking();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [open, bookingId, loadBooking]);

  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose?.();
      }
    };

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  const services = Array.isArray(booking?.serviceNames)
      ? booking.serviceNames
      : [];

  const handleOverlayClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose?.();
    }
  };

  return (
      <div
          className="employee-detail-overlay"
          onMouseDown={handleOverlayClick}
      >
        <section
            className="employee-detail-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="employee-booking-detail-title"
        >
          <header className="employee-detail-header">
            <div>
            <span className="employee-detail-eyebrow">
              Chi tiết booking
            </span>

              <h2 id="employee-booking-detail-title">
                {booking?.bookingCode || `Booking #${bookingId}`}
              </h2>
            </div>

            <button
                className="employee-detail-close"
                type="button"
                onClick={onClose}
                aria-label="Đóng chi tiết booking"
            >
              ×
            </button>
          </header>

          <div className="employee-detail-body">
            {loading && (
                <div className="employee-detail-state">
                  <div className="employee-detail-spinner" />
                  <p>Đang tải chi tiết booking...</p>
                </div>
            )}

            {!loading && errorMessage && (
                <div className="employee-detail-state employee-detail-state--error">
                  <p>{errorMessage}</p>

                  <button type="button" onClick={loadBooking}>
                    Thử lại
                  </button>
                </div>
            )}

            {!loading && !errorMessage && booking && (
                <>
                  <div className="employee-detail-summary">
                    <div>
                      <span>Trạng thái</span>
                      <BookingStatusBadge status={booking.status} />
                    </div>

                    <div>
                      <span>Tổng tiền</span>
                      <strong>
                        {formatMoney(
                            booking.finalAmount != null && booking.finalAmount > 0
                                ? booking.finalAmount
                                : booking.totalAmount
                        )}
                      </strong>
                      {booking.discountAmount > 0 && (
                        <small style={{ color: "#16a34a", display: "block", fontSize: "11px", marginTop: "2px" }}>
                          (Đã giảm {formatMoney(booking.discountAmount)})
                        </small>
                      )}
                    </div>
                  </div>

                  <div className="employee-detail-grid">
                    <DetailItem
                        label="Khách hàng"
                        value={booking.customerName}
                    />

                    <DetailItem
                        label="Số điện thoại"
                        value={booking.customerPhoneMasked}
                    />

                    <DetailItem
                        label="Biển số xe"
                        value={booking.licensePlate}
                    />

                    <DetailItem
                        label="Loại xe"
                        value={formatVehicleType(booking.vehicleType)}
                    />

                    <DetailItem
                        label="Ngày sử dụng"
                        value={formatDate(booking.slotDate)}
                    />

                    <DetailItem
                        label="Khung giờ"
                        value={`${formatTime(
                            booking.slotStartTime
                        )} - ${formatTime(booking.slotEndTime)}`}
                    />

                    <DetailItem
                        label="Chi nhánh"
                        value={booking.branchName}
                    />

                    <DetailItem
                        label="Khoang rửa"
                        value={booking.bayName}
                    />

                    <DetailItem
                        label="Nhân viên phụ trách"
                        value={booking.assignedEmployeeName}
                    />

                    <DetailItem
                        label="Thời gian chờ"
                        value={`${booking.waitingMinutes ?? 0} phút`}
                    />

                    <DetailItem
                        label="Check-in lúc"
                        value={formatDateTime(booking.checkInAt)}
                    />

                    <DetailItem
                        label="Hoàn thành lúc"
                        value={formatDateTime(booking.completedAt)}
                    />

                    <DetailItem
                        label="Dịch vụ"
                        fullWidth
                        value={
                          services.length > 0
                              ? services.join(", ")
                              : "Chưa có thông tin dịch vụ"
                        }
                    />

                    <DetailItem
                        label="Ghi chú"
                        fullWidth
                        value={booking.note || "Không có ghi chú"}
                    />
                  </div>
                </>
            )}
          </div>

          <footer className="employee-detail-footer">
            <button type="button" onClick={onClose}>
              Đóng
            </button>
          </footer>
        </section>
      </div>
  );
}

export default EmployeeBookingDetailModal;