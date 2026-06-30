import axiosClient from './axiosClient'

const authApi = {
  login: (credentials) => axiosClient.post('/auth/login', credentials),
  register: (payload) => axiosClient.post('/auth/register', payload),
  refresh: (token) => axiosClient.post('/auth/refresh', { token }),
  forgotPassword: (email) => axiosClient.post('/auth/forgot-password/request', { email }),
}

export default authApi
