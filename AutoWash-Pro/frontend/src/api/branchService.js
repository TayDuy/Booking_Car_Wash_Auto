import axiosClient from "./axiosClient";

// Lấy danh sách chi nhánh (có thể lọc theo trạng thái hoạt động)
export const getBranches = async (status = null) => {
   const url = status ? `/branches?status=${status}` : "/branches";
   return axiosClient.get(url);
};

// Lấy chi tiết 1 chi nhánh theo ID
export const getBranchById = async (id) => {
   return axiosClient.get(`/branches/${id}`);
};

// Tạo chi nhánh mới (Chỉ ADMIN)
export const createBranch = async (data) => {
   return axiosClient.post("/branches", data);
};

// Cập nhật thông tin chi nhánh (Chỉ ADMIN)
export const updateBranch = async (id, data) => {
   return axiosClient.put(`/branches/${id}`, data);
};

// Đổi trạng thái hoạt động của chi nhánh (Chỉ ADMIN)
export const changeBranchStatus = async (id, status) => {
   return axiosClient.patch(`/branches/${id}/status?status=${status}`);
};

// Xóa mềm chi nhánh - chuyển về CLOSED (Chỉ ADMIN)
export const deleteBranch = async (id) => {
   return axiosClient.delete(`/branches/${id}`);
};