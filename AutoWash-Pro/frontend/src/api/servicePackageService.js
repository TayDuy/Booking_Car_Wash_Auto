import axiosClient from "./axiosClient";

const API_URL = "http://localhost:8080/api/v1";

export const getActiveServices = async () => {
  return axiosClient.get(
    `${API_URL}/service-packages/active`
  );
};