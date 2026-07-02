import axiosClient from './axiosClient'

const bookingApi = {
  list: (params) => axiosClient.get('/staff/bookings', { params }),
  myBookings: (customerId) => axiosClient.get(`/bookings/my/${customerId}`),

  get: (id) => axiosClient.get(`/staff/bookings/${id}`),

  create: (payload) => axiosClient.post('/bookings', payload),

  update: (id, payload) => axiosClient.put(`/staff/bookings/${id}`, payload),

  cancel: (id) => axiosClient.delete(`/staff/bookings/${id}/cancel`),

  complete: (id) => axiosClient.patch(`/staff/bookings/${id}/complete`),

  confirm: (id) => axiosClient.patch(`/staff/bookings/${id}/confirm`),
}

export default bookingApi