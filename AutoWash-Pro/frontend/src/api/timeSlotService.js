import axiosClient from "./axiosClient";

export const getAvailableSlots = async (branchId, date) => {
  return axiosClient.get("/time-slots/available", {
    params: { branchId, date },
  });
};

export const getSlotsByBranchAndDate = async (branchId, date) => {
  return axiosClient.get("/time-slots", {
    params: { branchId, date },
  });
};

export const generateMonthlySlots = async (payload) => {
    return axiosClient.post("/time-slots/generate", payload);
};

// Tạo 1 khung giờ (time slot) đơn lẻ cho 1 bay cụ thể.
export const createTimeSlot = async (payload) => {
  return axiosClient.post("/time-slots", payload);
};
