import axiosClient from "./axiosClient";

const reportApi = {
  dashboard: () => axiosClient.get("/reports/dashboard"),
};

export default reportApi;