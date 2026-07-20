import axiosClient from "./axiosClient";

const adminCustomerRewardApi = {
  getAllCustomerRewards() {
    return axiosClient.get(
      "/customer/rewards/admin/all"
    );
  },

  getCustomerRewards(customerId) {
    return axiosClient.get(
      `/customer/rewards/my/${customerId}`
    );
  },
};

export default adminCustomerRewardApi;