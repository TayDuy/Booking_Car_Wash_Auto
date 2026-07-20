import axiosClient from "./axiosClient";

const rewardApi = {
  list() {
    return axiosClient.get("/rewards");
  },

  detail(rewardId) {
    return axiosClient.get(`/rewards/${rewardId}`);
  },

  create(payload) {
    return axiosClient.post("/rewards", payload);
  },

  update(rewardId, payload) {
    return axiosClient.put(
      `/rewards/${rewardId}`,
      payload
    );
  },

  deactivate(rewardId) {
    return axiosClient.delete(
      `/rewards/${rewardId}`
    );
  },
};

export default rewardApi;