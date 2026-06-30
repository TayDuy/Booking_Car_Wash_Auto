import axiosClient from './axiosClient'

const bookingApi = {
  list: (params) => axiosClient.get('/staff/bookings', { params }),
  myBookings: (customerId) => axiosClient.get(`/bookings/my/${customerId}`),
  get: (id) => axiosClient.get(`/bookings/${id}`),
  create: (payload) => axiosClient.post('/bookings', payload),
  update: (id, payload) => axiosClient.put(`/bookings/${id}`, payload),
  cancel: (id) => axiosClient.delete(`/staff/bookings/${id}/cancel`),
}

export default bookingApi