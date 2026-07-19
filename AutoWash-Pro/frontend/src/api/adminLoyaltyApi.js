import axiosClient from "./axiosClient";

const adminLoyaltyApi = {
  getCustomerTransactions(customerId, transactionType) {
    const params = {};

    if (transactionType && transactionType !== "all") {
      params.transactionType = transactionType;
    }

    return axiosClient.get(
      `/loyalty-transactions/customers/${customerId}`,
      { params }
    );
  },

  getCustomerBalance(customerId) {
    return axiosClient.get(
      `/loyalty-transactions/customers/${customerId}/balance`
    );
  },
};

export default adminLoyaltyApi;