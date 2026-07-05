import axiosClient from './axiosClient'

const bookingApi = {
  list: (params) => axiosClient.get('/staff/bookings', { params }),
  myBookings: (status) => axiosClient.get('/customer/bookings/my', { params: status ? { status } : {} }),
  get: (id) => axiosClient.get(`/customer/bookings/${id}`),
  create: (payload) => axiosClient.post('/customer/bookings', payload),
  update: (id, payload) => axiosClient.put(`/staff/bookings/${id}`, payload),
  cancel: (id) => axiosClient.patch(`/customer/bookings/${id}/cancel`),
  cancelByStaff: (id) => axiosClient.patch(`/staff/bookings/${id}/cancel`),
}

export default bookingApi