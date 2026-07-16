import axiosClient from "./axiosClient";

const systemSettingApi = {
  get: () => axiosClient.get("/admin/settings"),

  update: (payload) =>
    axiosClient.put("/admin/settings", payload),

  reset: () =>
    axiosClient.post("/admin/settings/reset"),
};

export default systemSettingApi;