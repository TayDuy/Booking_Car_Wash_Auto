import axiosClient from './axiosClient'

const customerApi = {
  profile: () => axiosClient.get('/customers/me'),
  updateProfile: (payload) => axiosClient.put('/customers/me', payload),
  list: (params) => axiosClient.get('/customers', { params }),
  update: (id, payload) => axiosClient.put(`/customers/${id}`, payload),
  delete: (id) => axiosClient.delete(`/customers/${id}`),
}

export default customerApi
