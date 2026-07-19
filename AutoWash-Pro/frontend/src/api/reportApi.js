import axiosClient from "./axiosClient";

const reportApi = {
  dashboard: (fromDate, toDate) =>
    axiosClient.get("/reports/dashboard", {
      params: {
        ...(fromDate ? { fromDate } : {}),
        ...(toDate ? { toDate } : {}),
      },
    }),
};

export default reportApi;