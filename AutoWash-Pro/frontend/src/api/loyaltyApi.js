import axiosClient from './axiosClient'

const loyaltyApi = {
  getPoints: (customerId) => axiosClient.get(`/loyalty/${customerId}/points`),
  redeem: (customerId, payload) => axiosClient.post(`/loyalty/${customerId}/redeem`, payload),
  rewards: () => axiosClient.get('/loyalty/rewards'),
}

export default loyaltyApi
