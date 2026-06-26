import axiosClient from "./axiosClient";

const bookingApi = {
  list: (params) => axiosClient.get("/staff/bookings", { params }),

  get: (id) => axiosClient.get(`/bookings/${id}`),

  create: (payload) => axiosClient.post("/bookings", payload),

  myBookings: (customerId) =>
    axiosClient.get(`/bookings/my/${customerId}`),

  cancel: (id) =>
    axiosClient.delete(`/bookings/${id}/cancel`),

  update: (id, payload) =>
    axiosClient.put(`/staff/bookings/${id}`, payload),

  complete: (id) =>
    axiosClient.patch(`/staff/bookings/${id}/complete`),
};

export default bookingApi;