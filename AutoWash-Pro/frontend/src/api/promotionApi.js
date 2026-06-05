import axiosClient from './axiosClient'

const promotionApi = {
  list: (params) => axiosClient.get('/promotions', { params }),
  get: (id) => axiosClient.get(`/promotions/${id}`),
}

export default promotionApi
