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
  getProfile: () => {
    return axiosClient.get(`${EMPLOYEE_BASE_PATH}/profile`);
  },

  getQueue: ({ date, status } = {}) => {
    return axiosClient.get(`${EMPLOYEE_BASE_PATH}/queue`, {
      params: {
        date: date || undefined,
        status: status || undefined,
      },
    });
  },

  getBookingById: (bookingId) => {
    return axiosClient.get(
        `${EMPLOYEE_BASE_PATH}/bookings/${bookingId}`
    );
  },

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

  createWalkInBooking: (payload) => {
    return axiosClient.post(
        `${EMPLOYEE_BASE_PATH}/bookings`,
        payload
    );
  },

  confirmBooking: (bookingId) => {
    return axiosClient.patch(
        `${EMPLOYEE_BASE_PATH}/bookings/${bookingId}/confirm`
    );
  },

  checkInBooking: (bookingId) => {
    return axiosClient.patch(
        `${EMPLOYEE_BASE_PATH}/bookings/${bookingId}/check-in`
    );
  },

  startWash: (bookingId) => {
    return axiosClient.patch(
        `${EMPLOYEE_BASE_PATH}/bookings/${bookingId}/start-wash`
    );
  },

  completeBooking: (bookingId) => {
    return axiosClient.patch(
        `${EMPLOYEE_BASE_PATH}/bookings/${bookingId}/complete`
    );
  },

  // =========================================================
  // PAYMENT — thanh toán tại trạm
  // =========================================================

  collectCashPayment: (bookingId) => {
    return axiosClient.patch(
        `${EMPLOYEE_BASE_PATH}/bookings/${bookingId}/collect-cash-payment`
    );
  },

  createOnlinePayment: (bookingId) => {
    return axiosClient.post(
        `${EMPLOYEE_BASE_PATH}/bookings/${bookingId}/online-payment`
    );
  },

  getOnlinePaymentQr: (bookingId) => {
    return axiosClient.get(
        `${EMPLOYEE_BASE_PATH}/bookings/${bookingId}/online-payment/vnpay-qr`,
        { responseType: "blob" }
    );
  },
};

export default employeeApi;