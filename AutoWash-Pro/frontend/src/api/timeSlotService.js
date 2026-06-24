import axios from "axios";

const API_URL = "http://localhost:8080/api/v1";

export const getAvailableSlots = async (
  branchId,
  date
) => {
  return axios.get(
    `${API_URL}/time-slots/available`,
    {
      params: {
        branchId,
        date
      }
    }
  );
};