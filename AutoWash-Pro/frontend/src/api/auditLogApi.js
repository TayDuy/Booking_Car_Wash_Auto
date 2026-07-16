import axiosClient from "./axiosClient";

const auditLogApi = {
    getAll: () => axiosClient.get("/audit-logs"),
};

export default auditLogApi;