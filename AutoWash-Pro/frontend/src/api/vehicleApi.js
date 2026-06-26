import axiosClient from "./axiosClient";

const vehicleApi = {
  list: (params) => axiosClient.get('/vehicles', { params }),
  get: (id) => axiosClient.get(`/vehicles/${id}`),
  create: (payload) => axiosClient.post('/vehicles', payload),
  update: (id, payload) => axiosClient.put(`/vehicles/${id}`, payload),
  delete: (id) => axiosClient.delete(`/vehicles/${id}`),
  toggleActive: (id) => axiosClient.put(`/vehicles/${id}/toggle-active`),
};

export default vehicleApi;