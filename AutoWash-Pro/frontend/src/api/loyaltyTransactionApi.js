import axiosClient from "./axiosClient";

export async function getMyTransactionHistory(transactionType) {
  const params = {};
  if (transactionType) {
    params.transactionType = transactionType;
  }
  const response = await axiosClient.get("/loyalty-transactions/me", { params });
  return response.data;
}

export async function getMyPointBalance() {
  const response = await axiosClient.get("/loyalty-transactions/me/balance");
  return response.data;
}
