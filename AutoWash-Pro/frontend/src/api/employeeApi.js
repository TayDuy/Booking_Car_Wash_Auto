import axiosClient from "./axiosClient";

const EMPLOYEE_BASE_PATH = "/employee";

const employeeApi = {
  /** GET /api/v1/employee/profile */
  getProfile: () =>
      axiosClient.get(`${EMPLOYEE_BASE_PATH}/profile`),

  /**
   * GET /api/v1/employee/queue
   * Không truyền status sẽ lấy các trạng thái đang vận hành.
   */
  getQueue: ({ date, status } = {}) =>
      axiosClient.get(`${EMPLOYEE_BASE_PATH}/queue`, {
        params: {
          date: date || undefined,
          status: status || undefined,
        },
      }),

  /** GET /api/v1/employee/bookings/{bookingId} */
  getBookingById: (bookingId) =>
      axiosClient.get(
          `${EMPLOYEE_BASE_PATH}/bookings/${bookingId}`
      ),

  /** GET /api/v1/employee/bookings/search?bookingCode=... */
  searchBookingByCode: (bookingCode) =>
      axiosClient.get(`${EMPLOYEE_BASE_PATH}/bookings/search`, {
        params: {
          bookingCode: bookingCode?.trim(),
        },
      }),

  /**
   * POST /api/v1/employee/bookings
   *
   * BE không lưu Payment. Việc xóa paymentMethod tại đây giúp
   * những component FE cũ chưa cập nhật vẫn không gửi field thừa.
   */
  createWalkInBooking: (payload = {}) => {
    const requestPayload = { ...payload };
    delete requestPayload.paymentMethod;

    return axiosClient.post(
        `${EMPLOYEE_BASE_PATH}/bookings`,
        requestPayload
    );
  },

  /** pending -> confirmed */
  confirmBooking: (bookingId) =>
      axiosClient.patch(
          `${EMPLOYEE_BASE_PATH}/bookings/${bookingId}/confirm`
      ),

  /** confirmed -> checked_in */
  checkInBooking: (bookingId) =>
      axiosClient.patch(
          `${EMPLOYEE_BASE_PATH}/bookings/${bookingId}/check-in`
      ),

  /** confirmed -> no_show */
  markNoShow: (bookingId) =>
      axiosClient.patch(
          `${EMPLOYEE_BASE_PATH}/bookings/${bookingId}/no-show`
      ),

  /**
   * checked_in -> in_progress
   * bayId không bắt buộc; bỏ trống để dùng wash bay của slot.
   */
  startWash: (bookingId, bayId) =>
      axiosClient.patch(
          `${EMPLOYEE_BASE_PATH}/bookings/${bookingId}/start-wash`,
          null,
          {
            params: {
              bayId: bayId || undefined,
            },
          }
      ),

  /**
   * in_progress -> completed
   * Employee chỉ gọi sau khi đã kiểm tra khách thanh toán tại quầy.
   */
  completeBooking: (bookingId) =>
      axiosClient.patch(
          `${EMPLOYEE_BASE_PATH}/bookings/${bookingId}/complete`
      ),
};

export default employeeApi;