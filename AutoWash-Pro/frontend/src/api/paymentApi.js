import axiosClient from "./axiosClient";

const paymentApi = {
  /**
   * GET /api/v1/payments
   * GET /api/v1/payments?status=paid
   */
  list: (status) => {
    const params = status && status !== "all"
      ? { status }
      : {};

    return axiosClient.get("/payments", { params });
  },

  /**
   * GET /api/v1/payments/{paymentId}
   */
  detail: (paymentId) =>
    axiosClient.get(`/payments/${paymentId}`),

  /**
   * GET /api/v1/payments/booking/{bookingId}
   */
  getByBooking: (bookingId) =>
    axiosClient.get(`/payments/booking/${bookingId}`),
};

export default paymentApi;