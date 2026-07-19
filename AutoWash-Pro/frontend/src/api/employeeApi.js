import axiosClient from "./axiosClient";

const EMPLOYEE_BASE_PATH = "/employee";

function buildQueueParams({
  date,
  status,
  page = 0,
  size = 9,
} = {}) {
  const normalizedPage = Number.isInteger(Number(page))
    ? Math.max(Number(page), 0)
    : 0;

  const normalizedSize = Number.isInteger(Number(size))
    ? Math.min(Math.max(Number(size), 1), 100)
    : 9;

  return {
    date: date?.trim() || undefined,
    status: status?.trim() || undefined,
    page: normalizedPage,
    size: normalizedSize,
  };
}

const employeeApi = {
  /**
   * Lấy hồ sơ Employee đang đăng nhập.
   * GET /api/v1/employee/profile
   */
  getProfile: () => {
    return axiosClient.get(`${EMPLOYEE_BASE_PATH}/profile`);
  },

  /**
   * Lấy hàng đợi của chi nhánh Employee.
   *
   * Không truyền status:
   * pending, confirmed, checked_in, in_progress.
   *
   * GET /api/v1/employee/queue
   */
  getQueue: ({ date, status } = {}) => {
    return axiosClient.get(`${EMPLOYEE_BASE_PATH}/queue`, {
      params: {
        date: date || undefined,
        status: status || undefined,
      },
    });
  },

  /**
   * Xem booking theo ID.
   * GET /api/v1/employee/bookings/{bookingId}
   */
  getBookingById: (bookingId) => {
    return axiosClient.get(
      `${EMPLOYEE_BASE_PATH}/bookings/${bookingId}`
    );
  },

  /**
   * Tìm booking bằng mã.
   * GET /api/v1/employee/bookings/search
   */
  searchBookingByCode: (bookingCode) => {
    return axiosClient.get(
      `${EMPLOYEE_BASE_PATH}/bookings/search`,
      {
        params: {
          bookingCode: bookingCode?.trim(),
        },
      }
    );
  },

  /**
   * Employee tạo booking cho khách tại quầy.
   * POST /api/v1/employee/bookings
   */
  createWalkInBooking: (payload) => {
    return axiosClient.post(
      `${EMPLOYEE_BASE_PATH}/bookings`,
      payload
    );
  },

  /**
   * pending → confirmed
   */
  confirmBooking: (bookingId) => {
    return axiosClient.patch(
      `${EMPLOYEE_BASE_PATH}/bookings/${bookingId}/confirm`
    );
  },

  /**
   * confirmed → checked_in
   */
  checkInBooking: (bookingId) => {
    return axiosClient.patch(
      `${EMPLOYEE_BASE_PATH}/bookings/${bookingId}/check-in`
    );
  },

  /**
   * checked_in → in_progress
   */
  startWash: (bookingId) => {
    return axiosClient.patch(
      `${EMPLOYEE_BASE_PATH}/bookings/${bookingId}/start-wash`
    );
  },

  /**
   * in_progress → completed
   */
  completeBooking: (bookingId) => {
    return axiosClient.patch(
      `${EMPLOYEE_BASE_PATH}/bookings/${bookingId}/complete`
    );
  },
};

export default employeeApi;