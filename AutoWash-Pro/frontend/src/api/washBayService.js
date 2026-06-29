import axiosClient from "./axiosClient";

// Lấy toàn bộ danh sách khoang rửa trong hệ thống
export const getAllBays = async () => {
    return axiosClient.get("/wash-bays");
};

// Lấy danh sách khoang rửa riêng của một chi nhánh
export const getBaysByBranch = async (branchId) => {
    return axiosClient.get(`/wash-bays/branch/${branchId}`);
};

// Tạo mới khoang rửa (Chỉ ADMIN)
export const createBay = async (data) => {
    return axiosClient.post("/wash-bays", data);
};

// Cập nhật thông tin khoang rửa (Chỉ ADMIN)
export const updateBay = async (id, data) => {
    return axiosClient.put(`/wash-bays/${id}`, data);
};

// Đổi trạng thái hoạt động nhanh của khoang (Chỉ ADMIN)
export const updateBayStatus = async (id, status) => {
    return axiosClient.patch(`/wash-bays/${id}/status?value=${status}`);
};

// Xóa khoang rửa (Chỉ ADMIN)
export const deleteBay = async (id) => {
    return axiosClient.delete(`/wash-bays/${id}`);
};