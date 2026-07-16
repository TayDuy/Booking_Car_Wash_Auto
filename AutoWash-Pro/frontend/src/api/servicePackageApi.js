import axiosClient from "./axiosClient";

const servicePackageApi = {
  list: () => axiosClient.get("/service-packages"),
  active: () => axiosClient.get("/service-packages/active"),
  get: (id) => axiosClient.get(`/service-packages/${id}`),
  create: (payload) => axiosClient.post("/service-packages", payload),
  update: (id, payload) => axiosClient.put(`/service-packages/${id}`, payload),
  delete: (id) => axiosClient.delete(`/service-packages/${id}`),
};

export default servicePackageApi;