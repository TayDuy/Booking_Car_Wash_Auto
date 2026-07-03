import axiosClient from "./axiosClient";

export async function evaluateCustomerTier(customerId) {
  const response = await axiosClient.post(
    `/loyalty-tiers/evaluation/customers/${customerId}`
  );

  return response.data;
}