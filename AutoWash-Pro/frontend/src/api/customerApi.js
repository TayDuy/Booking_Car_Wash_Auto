import axiosClient from './axiosClient'

const customerApi = {
  profile: () => axiosClient.get('/customers/me'),
  updateProfile: (payload) => axiosClient.put('/customers/me', payload),
  list: (params) => axiosClient.get('/customers', { params }),
}

export default customerApi
