import axios from "axios";

const API_URL = "http://localhost:8080/api/v1";

export const getActiveServices = async () => {
  return axios.get(
    `${API_URL}/service-packages/active`
  );
};