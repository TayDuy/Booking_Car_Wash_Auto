import axiosClient from './axiosClient'

const bookingApi = {
  list: (params) => axiosClient.get('/bookings', { params }),
  get: (id) => axiosClient.get(`/bookings/${id}`),
  create: (payload) => axiosClient.post('/bookings', payload),
  update: (id, payload) => axiosClient.put(`/bookings/${id}`, payload),
  cancel: (id) => axiosClient.delete(`/bookings/${id}`),
}

export default bookingApi
