import axiosClient from "./axiosClient";

const userApi = {
  list: () => axiosClient.get("/admin/users"),

  updateRole: (id, role) =>
    axiosClient.put(`/admin/users/${id}/role`, null, {
      params: {
        newRole: role,
      },
    }),

  updateStatus: (id, status) =>
    axiosClient.put(`/admin/users/${id}/status`, null, {
      params: {
        status,
      },
    }),
};

export default userApi;