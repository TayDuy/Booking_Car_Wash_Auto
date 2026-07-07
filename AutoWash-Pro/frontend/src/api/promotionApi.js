import axiosClient from "./axiosClient";

const promotionApi = {
  list: (params) => axiosClient.get("/promotions", { params }),
  active: () => axiosClient.get("/promotions/active"),
  get: (id) => axiosClient.get(`/promotions/${id}`),
  create: (payload) => axiosClient.post("/promotions", payload),
  update: (id, payload) => axiosClient.put(`/promotions/${id}`, payload),
  delete: (id) => axiosClient.delete(`/promotions/${id}`),
  expireExpired: () => axiosClient.post("/promotions/expire-expired"),
};

export default promotionApi;