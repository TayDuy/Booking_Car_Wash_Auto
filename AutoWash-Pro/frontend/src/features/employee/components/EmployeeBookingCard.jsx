import {
  CalendarClock,
  Car,
  CircleDollarSign,
  Clock3,
  MapPin,
  UserRound,
  Wrench,
} from "lucide-react";

import BookingStatusBadge from "./BookingStatusBadge";
import {
  normalizeEmployeeBookingStatus,
} from "../constants/employeeBookingStatus";

import "./EmployeeBookingCard.css";

const ACTION_BUTTON_CLASS = {
  confirm: "action-confirm",
  "check-in": "action-check-in",
  "no-show": "action-no-show",
  "start-wash": "action-start-wash",
  complete: "action-complete",
};

const ACTIONS_BY_STATUS = {
  pending: [
    { key: "confirm", label: "Xác nhận" },
  ],
  confirmed: [
    { key: "check-in", label: "Check-in" },
    { key: "no-show", label: "Khách không đến" },
  ],
  checked_in: [
    { key: "start-wash", label: "Bắt đầu rửa" },
  ],
  in_progress: [
    {
      key: "complete",
      label: "Đã thanh toán & hoàn thành",
    },
  ],
};

const NO_SHOW_GRACE_MINUTES = 15;

function formatCurrency(value) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "Chưa xác định";
  }

  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date) {
  if (!date) {
    return "Chưa xác định";
  }

  const parsedDate = new Date(`${date}T00:00:00`);

  if (Number.isNaN(parsedDate.getTime())) {
    return date;
  }

  return new Intl.DateTimeFormat("vi-VN").format(parsedDate);
}

function formatTime(time) {
  if (!time) {
    return "--:--";
  }

  return String(time).slice(0, 5);
}

function formatServices(serviceNames) {
  if (!Array.isArray(serviceNames) || serviceNames.length === 0) {
    return "Chưa có dịch vụ";
  }

  return serviceNames.join(", ");
}

function formatVehicleType(vehicleType) {
  const normalizedType = String(vehicleType ?? "").toLowerCase();

  const labels = {
    car: "Xe 4 chỗ",
    suv: "Xe 7 chỗ",
  };

  return labels[normalizedType] || vehicleType || "Chưa xác định";
}

function canMarkNoShow(booking, status) {
  if (
      status !== "confirmed" ||
      !booking?.slotDate ||
      !booking?.slotStartTime
  ) {
    return false;
  }

  const startTime = String(booking.slotStartTime).slice(0, 8);
  const slotStart = new Date(`${booking.slotDate}T${startTime}`);

  if (Number.isNaN(slotStart.getTime())) {
    return false;
  }

  const allowedAt = new Date(
      slotStart.getTime() + NO_SHOW_GRACE_MINUTES * 60 * 1000
  );

  return Date.now() >= allowedAt.getTime();
}

function EmployeeBookingCard({
                               booking,
                               onAction,
                               onViewDetails,
                               actionLoading = false,
                             }) {
  if (!booking) {
    return null;
  }

  const status = normalizeEmployeeBookingStatus(booking.status);
  const availableActions = ACTIONS_BY_STATUS[status] || [];
  const noShowAvailable = canMarkNoShow(booking, status);

  const handleAction = (action) => {
    if (!action || actionLoading) {
      return;
    }

    onAction?.({
      bookingId: booking.bookingId,
      action: action.key,
      booking,
    });
  };

  const handleViewDetails = () => {
    onViewDetails?.(booking);
  };

  return (
      <article className="employee-booking-card">
        <header className="employee-booking-card__header">
          <div>
            <p className="employee-booking-card__code-label">
              Mã booking
            </p>

            <h2 className="employee-booking-card__code">
              {booking.bookingCode || `#${booking.bookingId}`}
            </h2>
          </div>

          <BookingStatusBadge status={status} />
        </header>

        <div className="employee-booking-card__vehicle">
          <div className="employee-booking-card__vehicle-icon">
            <Car size={24} aria-hidden="true" />
          </div>

          <div>
            <strong className="employee-booking-card__license-plate">
              {booking.licensePlate || "Chưa có biển số"}
            </strong>

            <span className="employee-booking-card__vehicle-type">
            {formatVehicleType(booking.vehicleType)}
          </span>
          </div>
        </div>

        <div className="employee-booking-card__details">
          <div className="employee-booking-card__detail">
            <UserRound size={18} aria-hidden="true" />

            <div>
              <span>Khách hàng</span>
              <strong>{booking.customerName || "Khách tại quầy"}</strong>
              <small>{booking.customerPhoneMasked || "Chưa có SĐT"}</small>
            </div>
          </div>

          <div className="employee-booking-card__detail">
            <Wrench size={18} aria-hidden="true" />

            <div>
              <span>Dịch vụ</span>
              <strong>{formatServices(booking.serviceNames)}</strong>
            </div>
          </div>

          <div className="employee-booking-card__detail">
            <CalendarClock size={18} aria-hidden="true" />

            <div>
              <span>Lịch hẹn</span>
              <strong>{formatDate(booking.slotDate)}</strong>

              <small>
                {formatTime(booking.slotStartTime)}
                {" – "}
                {formatTime(booking.slotEndTime)}
              </small>
            </div>
          </div>

          <div className="employee-booking-card__detail">
            <MapPin size={18} aria-hidden="true" />

            <div>
              <span>Khu vực rửa</span>
              <strong>{booking.bayName || "Chưa phân bay"}</strong>
              <small>{booking.branchName || "Chưa xác định chi nhánh"}</small>
            </div>
          </div>

          <div className="employee-booking-card__detail">
            <CircleDollarSign size={18} aria-hidden="true" />

            <div>
              <span>Tổng tiền</span>
              <strong>{formatCurrency(booking.totalAmount)}</strong>
            </div>
          </div>

          <div className="employee-booking-card__detail">
            <Clock3 size={18} aria-hidden="true" />

            <div>
              <span>Thời gian chờ</span>
              <strong>
                {Number.isFinite(Number(booking.waitingMinutes))
                    ? `${booking.waitingMinutes} phút`
                    : "Chưa xác định"}
              </strong>
            </div>
          </div>
        </div>

        {booking.assignedEmployeeName && (
            <p className="employee-booking-card__assigned">
              Nhân viên phụ trách:{" "}
              <strong>{booking.assignedEmployeeName}</strong>
            </p>
        )}

        <footer className="employee-booking-card__footer">
          <button
              type="button"
              className="employee-booking-card__detail-button"
              onClick={handleViewDetails}
          >
            Xem chi tiết
          </button>

          {availableActions.map((action) => {
            const noShowDisabled =
                action.key === "no-show" && !noShowAvailable;

            return (
                <button
                    key={action.key}
                    type="button"
                    className={[
                      "employee-booking-card__action-button",
                      ACTION_BUTTON_CLASS[action.key] || "",
                    ].join(" ")}
                    onClick={() => handleAction(action)}
                    disabled={actionLoading || noShowDisabled}
                    title={
                      noShowDisabled
                          ? `Chỉ được đánh dấu sau giờ hẹn ${NO_SHOW_GRACE_MINUTES} phút`
                          : undefined
                    }
                >
                  {actionLoading ? "Đang xử lý..." : action.label}
                </button>
            );
          })}
        </footer>
      </article>
  );
}

export default EmployeeBookingCard;