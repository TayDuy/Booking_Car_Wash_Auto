export const EMPLOYEE_BOOKING_STATUS = Object.freeze({
  PENDING: "pending",
  CONFIRMED: "confirmed",
  CHECKED_IN: "checked_in",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  NO_SHOW: "no_show",
});

export const EMPLOYEE_BOOKING_STATUS_META = Object.freeze({
  [EMPLOYEE_BOOKING_STATUS.PENDING]: {
    value: EMPLOYEE_BOOKING_STATUS.PENDING,
    label: "Chờ xác nhận",
    className: "status-pending",
    nextAction: {
      key: "confirm",
      label: "Xác nhận",
    },
  },

  [EMPLOYEE_BOOKING_STATUS.CONFIRMED]: {
    value: EMPLOYEE_BOOKING_STATUS.CONFIRMED,
    label: "Đã xác nhận",
    className: "status-confirmed",
    nextAction: {
      key: "check-in",
      label: "Check-in",
    },
  },

  [EMPLOYEE_BOOKING_STATUS.CHECKED_IN]: {
    value: EMPLOYEE_BOOKING_STATUS.CHECKED_IN,
    label: "Đã check-in",
    className: "status-checked-in",
    nextAction: {
      key: "start-wash",
      label: "Bắt đầu rửa",
    },
  },

  [EMPLOYEE_BOOKING_STATUS.IN_PROGRESS]: {
    value: EMPLOYEE_BOOKING_STATUS.IN_PROGRESS,
    label: "Đang rửa",
    className: "status-in-progress",
    nextAction: {
      key: "complete",
      label: "Đã thanh toán & hoàn thành",
    },
  },

  [EMPLOYEE_BOOKING_STATUS.COMPLETED]: {
    value: EMPLOYEE_BOOKING_STATUS.COMPLETED,
    label: "Hoàn thành",
    className: "status-completed",
    nextAction: null,
  },

  [EMPLOYEE_BOOKING_STATUS.CANCELLED]: {
    value: EMPLOYEE_BOOKING_STATUS.CANCELLED,
    label: "Đã hủy",
    className: "status-cancelled",
    nextAction: null,
  },

  [EMPLOYEE_BOOKING_STATUS.NO_SHOW]: {
    value: EMPLOYEE_BOOKING_STATUS.NO_SHOW,
    label: "Khách không đến",
    className: "status-no-show",
    nextAction: null,
  },
});

export const EMPLOYEE_QUEUE_FILTER_OPTIONS = Object.freeze([
  {
    value: "",
    label: "Đang xử lý",
  },
  {
    value: EMPLOYEE_BOOKING_STATUS.PENDING,
    label: "Chờ xác nhận",
  },
  {
    value: EMPLOYEE_BOOKING_STATUS.CONFIRMED,
    label: "Đã xác nhận",
  },
  {
    value: EMPLOYEE_BOOKING_STATUS.CHECKED_IN,
    label: "Đã check-in",
  },
  {
    value: EMPLOYEE_BOOKING_STATUS.IN_PROGRESS,
    label: "Đang rửa",
  },
  {
    value: EMPLOYEE_BOOKING_STATUS.COMPLETED,
    label: "Hoàn thành",
  },
  {
    value: EMPLOYEE_BOOKING_STATUS.NO_SHOW,
    label: "Khách không đến",
  },
  {
    value: EMPLOYEE_BOOKING_STATUS.CANCELLED,
    label: "Đã hủy",
  },
]);

export function normalizeEmployeeBookingStatus(status) {
  return String(status ?? "")
      .trim()
      .toLowerCase();
}

export function getEmployeeBookingStatusMeta(status) {
  const normalizedStatus = normalizeEmployeeBookingStatus(status);

  return (
      EMPLOYEE_BOOKING_STATUS_META[normalizedStatus] ?? {
        value: normalizedStatus,
        label: status || "Không xác định",
        className: "status-unknown",
        nextAction: null,
      }
  );
}

export function getEmployeeBookingNextAction(status) {
  return getEmployeeBookingStatusMeta(status).nextAction;
}