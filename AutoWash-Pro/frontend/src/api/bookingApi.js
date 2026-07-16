import axiosClient from './axiosClient'

const bookingApi = {
  // Customer APIs
  myBookings: (customerId, limit) => {
    const path = customerId ? `/${customerId}` : '';
    const params = limit ? { limit } : {};
    return axiosClient.get(`/bookings/my${path}`, { params });
  },
  get: (id) => axiosClient.get(`/bookings/${id}`),
  create: (payload) => axiosClient.post('/bookings', payload),
  cancel: (id) => axiosClient.delete(`/bookings/${id}/cancel`),
  reschedule: (id, payload) => axiosClient.put(`/bookings/${id}/reschedule`, payload),

  // Staff/Admin APIs
  list: (params) => axiosClient.get('/staff/bookings', { params }),
  getForStaff: (id) => axiosClient.get(`/staff/bookings/${id}`),
  update: (id, payload) => axiosClient.put(`/staff/bookings/${id}`, payload),
  confirm: (id) => axiosClient.patch(`/staff/bookings/${id}/confirm`),
  checkIn: (id) => axiosClient.patch(`/staff/bookings/${id}/check-in`),
  complete: (id) => axiosClient.patch(`/staff/bookings/${id}/complete`),
  cancelByStaff: (id) => axiosClient.delete(`/staff/bookings/${id}/cancel`),
}

export default bookingApi