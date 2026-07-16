import axiosClient from './axiosClient'

const bookingApi = {
  // =========================================================
  // CUSTOMER
  // =========================================================

  myBookings: (customerId, limit) => {
    const path = customerId ? `/${customerId}` : '';
    const params = limit ? { limit } : {};
    return axiosClient.get(`/bookings/my${path}`, { params });
  },

  get: (id) => axiosClient.get(`/bookings/${id}`),

  create: (payload) => axiosClient.post('/bookings', payload),

  cancel: (id) => axiosClient.delete(`/bookings/${id}/cancel`),

  reschedule: (id, payload) => axiosClient.put(`/bookings/${id}/reschedule`, payload),

  // =========================================================
  // EMPLOYEE
  // =========================================================

  list: (params) => axiosClient.get('/employee/bookings', { params }),

  getForStaff: (id) => axiosClient.get(`/employee/bookings/${id}`),

  update: (id, payload) => axiosClient.put(`/employee/bookings/${id}`, payload),

  confirm: (id) => axiosClient.patch(`/employee/bookings/${id}/confirm`),

  checkIn: (id) => axiosClient.patch(`/employee/bookings/${id}/check-in`),

  complete: (id) => axiosClient.patch(`/employee/bookings/${id}/complete`),

  cancelByStaff: (id) => axiosClient.delete(`/employee/bookings/${id}/cancel`),

  // =========================================================
  // ADMIN
  // =========================================================

  adminList: (params) => axiosClient.get('/admin/bookings', { params }),

  adminDetail: (id) => axiosClient.get(`/admin/bookings/${id}`),

  adminAssignableStaff: (id) => axiosClient.get(`/admin/bookings/${id}/assignable-staff`),

  adminCreate: (payload) => axiosClient.post('/admin/bookings', payload),

  adminUpdate: (id, payload) => axiosClient.put(`/admin/bookings/${id}`, payload),

  adminCancel: (id) => axiosClient.delete(`/admin/bookings/${id}/cancel`),

  adminConfirm: (id) => axiosClient.patch(`/admin/bookings/${id}/confirm`),

  adminCheckIn: (id) => axiosClient.patch(`/admin/bookings/${id}/check-in`),

  adminStartWash: (id) => axiosClient.patch(`/admin/bookings/${id}/start-wash`),

  adminComplete: (id) => axiosClient.patch(`/admin/bookings/${id}/complete`),
}

export default bookingApi
