import axiosClient from "./axiosClient";

const bookingApi = {
  // =========================================================
  // CUSTOMER
  // =========================================================

  myBookings: (customerId, limit) => {
    const path = customerId ? `/${customerId}` : "";
    const params = limit ? { limit } : {};

    return axiosClient.get(`/bookings/my${path}`, { params });
  },

  get: (id) =>
    axiosClient.get(`/bookings/${id}`),

  create: (payload) =>
    axiosClient.post("/bookings", payload),

  cancel: (id) =>
    axiosClient.delete(`/bookings/${id}/cancel`),

  reschedule: (id, payload) =>
    axiosClient.put(`/bookings/${id}/reschedule`, payload),

  // =========================================================
  // EMPLOYEE / STAFF
  // =========================================================

  list: (params) =>
    axiosClient.get("/staff/bookings", { params }),

  getForStaff: (id) =>
    axiosClient.get(`/employee/bookings/${id}`),

  update: (id, payload) =>
    axiosClient.put(`/employee/bookings/${id}`, payload),

  confirm: (id) =>
    axiosClient.patch(`/employee/bookings/${id}/confirm`),

  checkIn: (id) =>
    axiosClient.patch(`/employee/bookings/${id}/check-in`),

  complete: (id) =>
    axiosClient.patch(`/employee/bookings/${id}/complete`),

  cancelByStaff: (id) =>
    axiosClient.delete(`/employee/bookings/${id}/cancel`),

  // =========================================================
  // ADMIN
  // Base URL đầy đủ:
  // /api/v1/admin/bookings
  // =========================================================

  /**
   * GET /api/v1/admin/bookings
   */
  adminList: (params) =>
    axiosClient.get("/admin/bookings", { params }),

  /**
   * GET /api/v1/admin/bookings/{bookingId}
   */
  adminDetail: (id) =>
    axiosClient.get(`/admin/bookings/${id}`),

  /**
 * GET /api/v1/admin/bookings/{bookingId}/assignable-staff
 */
  adminAssignableStaff: (id) =>
    axiosClient.get(`/admin/bookings/${id}/assignable-staff`),

  /**
   * POST /api/v1/admin/bookings
   */
  adminCreate: (payload) =>
    axiosClient.post("/admin/bookings", payload),

  /**
   * PUT /api/v1/admin/bookings/{bookingId}
   */
  adminUpdate: (id, payload) =>
    axiosClient.put(`/admin/bookings/${id}`, payload),

  /**
   * DELETE /api/v1/admin/bookings/{bookingId}/cancel
   */
  adminCancel: (id) =>
    axiosClient.delete(`/admin/bookings/${id}/cancel`),

  /**
   * PATCH /api/v1/admin/bookings/{bookingId}/confirm
   */
  adminConfirm: (id) =>
    axiosClient.patch(`/admin/bookings/${id}/confirm`),

  /**
   * PATCH /api/v1/admin/bookings/{bookingId}/check-in
   */
  adminCheckIn: (id) =>
    axiosClient.patch(`/admin/bookings/${id}/check-in`),

  /**
 * PATCH /api/v1/admin/bookings/{bookingId}/start-wash
 */
  adminStartWash: (id) =>
    axiosClient.patch(`/admin/bookings/${id}/start-wash`),

  /**
   * PATCH /api/v1/admin/bookings/{bookingId}/complete
   */
  adminComplete: (id) =>
    axiosClient.patch(`/admin/bookings/${id}/complete`),
};

export default bookingApi;