import axiosClient from './axiosClient'

const bookingApi = {
  // Customer APIs
  myBookings: (status) => axiosClient.get('/customer/bookings/my', { params: status ? { status } : {} }),
  get: (id) => axiosClient.get(`/customer/bookings/${id}`),
  create: (payload) => axiosClient.post('/customer/bookings', payload),
  cancel: (id) => axiosClient.patch(`/customer/bookings/${id}/cancel`),
  reschedule: (id, payload) => axiosClient.put(`/customer/bookings/${id}/reschedule`, payload),

  // Staff/Admin APIs
  list: (params) => axiosClient.get('/staff/bookings', { params }),
  getForStaff: (id) => axiosClient.get(`/staff/bookings/${id}`),
  update: (id, payload) => axiosClient.put(`/staff/bookings/${id}`, payload),
  confirm: (id) => axiosClient.patch(`/staff/bookings/${id}/confirm`),
  checkIn: (id) => axiosClient.patch(`/staff/bookings/${id}/check-in`),
  complete: (id) => axiosClient.patch(`/staff/bookings/${id}/complete`),
  cancelByStaff: (id) => axiosClient.patch(`/staff/bookings/${id}/cancel`),
}

export default bookingApi