import axiosClient from "./axiosClient";

const LOYALTY_TIER_EVALUATION_BASE_PATH = "/loyalty-tiers/evaluation";

/**
 * CUSTOMER xem hạng thành viên hiện tại (không trigger đánh giá lại).
 * GET /api/v1/loyalty-tiers/evaluation/me
 */
export async function getMyTier() {
  const resp = await axiosClient.get(`${LOYALTY_TIER_EVALUATION_BASE_PATH}/me`);
  return resp.data?.data || resp.data;
}

/**
 * CUSTOMER tự đánh giá lại hạng của mình.
 * POST /api/v1/loyalty-tiers/evaluation/me
 */
export async function evaluateMyTier() {
  const resp = await axiosClient.post(`${LOYALTY_TIER_EVALUATION_BASE_PATH}/me`);
  return resp.data?.data || resp.data;
}