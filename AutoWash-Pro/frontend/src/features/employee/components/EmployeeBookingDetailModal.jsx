import { useEffect, useRef, useState } from "react";
import employeeApi from "../../../api/employeeApi";
import paymentApi from "../../../api/paymentApi";
import BookingStatusBadge from "./BookingStatusBadge";
import {
  EMPLOYEE_PAYMENT_STATUS_MAP,
  EMPLOYEE_PAYMENT_METHOD_MAP,
} from "../constants/employeeBookingStatus";
import "./EmployeeBookingDetailModal.css";

const ONLINE_PAYMENT_POLL_INTERVAL_MS = 4000;

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

  // ── Thu tiền mặt tại quầy ──────────────────────────────────────────────
  const [collectingCash, setCollectingCash] = useState(false);
  const [collectError, setCollectError] = useState("");

  // ── Thanh toán online (VNPay QR) ──────────────────────────────────────
  const [onlinePayment, setOnlinePayment] = useState({
    status: "idle", // idle | loading | qr | paid | error
    qrObjectUrl: null,
    finalAmount: null,
    errorMessage: "",
  });
  const pollTimerRef = useRef(null);

  const loadBooking = async () => {
    if (!bookingId) return;

    try {
      setLoading(true);
      setErrorMessage("");

      const response = await employeeApi.getBookingById(bookingId);
      setBooking(unwrapResponse(response));
    } catch (error) {
      console.error("Load employee booking detail error:", error);
      setBooking(null);
      setErrorMessage(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const stopOnlinePaymentPolling = () => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  };

  const resetOnlinePayment = () => {
    stopOnlinePaymentPolling();

    setOnlinePayment((previous) => {
      if (previous.qrObjectUrl) {
        URL.revokeObjectURL(previous.qrObjectUrl);
      }

      return {
        status: "idle",
        qrObjectUrl: null,
        finalAmount: null,
        errorMessage: "",
      };
    });
  };

  const handleCollectCash = async () => {
    if (!bookingId || collectingCash) return;

    try {
      setCollectingCash(true);
      setCollectError("");

      const response = await employeeApi.collectCashPayment(bookingId);
      setBooking(unwrapResponse(response));
    } catch (error) {
      console.error("Collect cash payment error:", error);
      setCollectError(getErrorMessage(error));
    } finally {
      setCollectingCash(false);
    }
  };

  const handleStartOnlinePayment = async () => {
    if (!bookingId) return;

    try {
      setOnlinePayment({
        status: "loading",
        qrObjectUrl: null,
        finalAmount: null,
        errorMessage: "",
      });

      const createResponse = await employeeApi.createOnlinePayment(bookingId);
      const paymentInfo = unwrapResponse(createResponse);

      const qrResponse = await employeeApi.getOnlinePaymentQr(bookingId);
      const qrObjectUrl = URL.createObjectURL(qrResponse.data);

      setOnlinePayment({
        status: "qr",
        qrObjectUrl,
        finalAmount: paymentInfo?.finalAmount,
        errorMessage: "",
      });

      stopOnlinePaymentPolling();
      pollTimerRef.current = setInterval(async () => {
        try {
          const statusResponse = await paymentApi.getByBooking(bookingId);
          const paymentStatus = unwrapResponse(statusResponse);

          if (paymentStatus?.paymentStatus?.toLowerCase() === "paid") {
            stopOnlinePaymentPolling();
            setOnlinePayment((previous) => ({ ...previous, status: "paid" }));
            loadBooking();
          }
        } catch (error) {
          // Bỏ qua lỗi tạm thời khi poll (VD mạng chập chờn) — sẽ tự thử lại.
          console.error("Poll online payment status error:", error);
        }
      }, ONLINE_PAYMENT_POLL_INTERVAL_MS);
    } catch (error) {
      console.error("Create online payment error:", error);
      setOnlinePayment({
        status: "error",
        qrObjectUrl: null,
        finalAmount: null,
        errorMessage: getErrorMessage(error),
      });
    }
  };

  useEffect(() => {
    if (!open || !bookingId) {
      return;
    }

    loadBooking();
  }, [open, bookingId]);

  // Reset trạng thái thanh toán online mỗi khi đóng modal hoặc đổi booking,
  // tránh giữ QR/polling của booking trước đó.
  useEffect(() => {
    if (!open) {
      resetOnlinePayment();
      setCollectError("");
    }
  }, [open, bookingId]);

  useEffect(() => {
    return () => {
      stopOnlinePaymentPolling();
    };
  }, []);

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
                      <strong>{formatMoney(booking.totalAmount)}</strong>
                    </div>
                    <div>
                      <span>Thanh toán</span>
                      {(() => {
                        const statusKey = booking.paymentStatus?.toLowerCase();
                        const pmCfg =
                            EMPLOYEE_PAYMENT_STATUS_MAP[statusKey] ||
                            EMPLOYEE_PAYMENT_STATUS_MAP.unpaid;

                        const methodKey = booking.paymentMethod?.toLowerCase();
                        const methodLabel = methodKey
                            ? EMPLOYEE_PAYMENT_METHOD_MAP[methodKey] || methodKey
                            : null;

                        return (
                            <strong
                                className={`employee-detail-payment ${pmCfg.badge}`}
                            >
                              {pmCfg.label}
                              {methodLabel ? ` (${methodLabel})` : ""}
                            </strong>
                        );
                      })()}
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
                        value={booking.vehicleType}
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

                  {booking.status === "completed" &&
                      booking.paymentStatus?.toLowerCase() !== "paid" && (
                          <div className="employee-payment-collect">
                            <h3 className="employee-payment-collect__title">
                              Thu tiền tại trạm
                            </h3>

                            {collectError && (
                                <p className="employee-payment-collect__error">
                                  {collectError}
                                </p>
                            )}

                            <div className="employee-payment-collect__actions">
                              <button
                                  type="button"
                                  className="employee-payment-collect__cash-btn"
                                  onClick={handleCollectCash}
                                  disabled={
                                      collectingCash || onlinePayment.status === "loading"
                                  }
                              >
                                {collectingCash
                                    ? "Đang thu tiền..."
                                    : "Thu tiền mặt"}
                              </button>

                              <button
                                  type="button"
                                  className="employee-payment-collect__online-btn"
                                  onClick={handleStartOnlinePayment}
                                  disabled={
                                      collectingCash ||
                                      onlinePayment.status === "loading" ||
                                      onlinePayment.status === "qr"
                                  }
                              >
                                {onlinePayment.status === "loading"
                                    ? "Đang tạo mã QR..."
                                    : "Thanh toán online (VNPay)"}
                              </button>
                            </div>

                            {onlinePayment.status === "qr" && (
                                <div className="employee-payment-collect__qr">
                                  <img
                                      src={onlinePayment.qrObjectUrl}
                                      alt="Mã QR thanh toán VNPay"
                                  />

                                  <p>
                                    Số tiền cần thu:{" "}
                                    <strong>
                                      {formatMoney(
                                          onlinePayment.finalAmount ?? booking.totalAmount
                                      )}
                                    </strong>
                                  </p>

                                  <p className="employee-payment-collect__hint">
                                    Đưa mã QR cho khách quét bằng app ngân hàng/VNPay.
                                    Trạng thái sẽ tự cập nhật khi thanh toán thành
                                    công — không cần khách có tài khoản đăng nhập.
                                  </p>

                                  <button type="button" onClick={resetOnlinePayment}>
                                    Hủy / Đóng mã QR
                                  </button>
                                </div>
                            )}

                            {onlinePayment.status === "error" && (
                                <p className="employee-payment-collect__error">
                                  {onlinePayment.errorMessage}
                                </p>
                            )}
                          </div>
                      )}
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