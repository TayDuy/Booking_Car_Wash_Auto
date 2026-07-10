import axiosClient from "./axiosClient";

export async function getAllRewards() {
  const response = await axiosClient.get("/rewards");
  return response.data;
}

export async function redeemReward(rewardId, customerId) {
  const response = await axiosClient.post(
    `/customer/rewards/${rewardId}/redeem`,
    null,
    {
      params: {
        customerId,
      },
    }
  );

  return response.data;
}

export async function getMyRewards(customerId) {
  const response = await axiosClient.get(`/customer/rewards/my/${customerId}`);
  return response.data;
}

export async function useReward(voucherCode, bookingId) {
  const response = await axiosClient.patch("/customer/rewards/use", null, {
    params: {
      voucherCode,
      bookingId,
    },
  });

  return response.data;
}