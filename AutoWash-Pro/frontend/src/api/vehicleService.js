import axios from "axios";

const API_URL = "http://localhost:8080/api/v1";

const getToken = () =>
  localStorage.getItem("token");

export const getMyVehicles = async () => {
  return axios.get(
    `${API_URL}/vehicles`,
    {
      headers: {
        Authorization:
          `Bearer ${getToken()}`
      }
    }
  );
};