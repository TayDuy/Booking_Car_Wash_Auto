import axiosClient from "./axiosClient";

const API_URL = "http://localhost:8080/api/v1";

export const getAvailableSlots = async (branchId, date) => {
    return axiosClient.get(`${API_URL}/time-slots/available`, {
        params: { branchId, date }
    });
};

export const getSlotsByBranchAndDate = async (branchId, date) => {
    return axiosClient.get(`${API_URL}/time-slots`, {
        params: { branchId, date }
    });
};

export const generateMonthlySlots = async (payload) => {
    return axiosClient.post(`${API_URL}/time-slots/generate`, payload);
};