import axiosClient from "./axiosClient";

export async function getMyTier() {
  const response = await axiosClient.get("/loyalty-tiers/evaluation/me");
  return response.data;
}

export async function evaluateMyTier() {
  const response = await axiosClient.post("/loyalty-tiers/evaluation/me");
  return response.data;
}

export async function evaluateCustomerTier(customerId) {
  const response = await axiosClient.post(
    `/loyalty-tiers/evaluation/customers/${customerId}`
  );

  return response.data;
}