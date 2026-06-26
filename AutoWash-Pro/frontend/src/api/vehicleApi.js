import axiosClient from "./axiosClient";

const vehicleApi = {
  list: (params) =>
    axiosClient.get("/v1/vehicles", { params }),

  get: (id) =>
    axiosClient.get(`/v1/vehicles/${id}`),

  create: (payload) =>
    axiosClient.post("/v1/vehicles", payload),

  update: (id, payload) =>
    axiosClient.put(`/v1/vehicles/${id}`, payload),
};

export default vehicleApi;