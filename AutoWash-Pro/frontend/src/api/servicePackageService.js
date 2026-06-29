import axiosClient from "./axiosClient";

// Lấy danh sách tất cả dịch vụ, bao gồm cả gói ngưng hoạt động (Chỉ ADMIN)
export const getAllServices = async () => {
  return axiosClient.get("/service-packages");
};

// Lấy danh sách dịch vụ đang hoạt động (Dành cho Khách hàng chọn gói)
export const getActiveServices = async () => {
  return axiosClient.get("/service-packages/active");
};

// Lấy chi tiết 1 dịch vụ
export const getServiceById = async (id) => {
  return axiosClient.get(`/service-packages/${id}`);
};

// Tạo gói dịch vụ mới (Chỉ ADMIN)
export const createService = async (data) => {
  return axiosClient.post("/service-packages", data);
};

// Cập nhật thông tin gói dịch vụ (Chỉ ADMIN)
export const updateService = async (id, data) => {
  return axiosClient.put(`/service-packages/${id}`, data);
};

// Vô hiệu hóa/Xóa mềm gói dịch vụ (Chỉ ADMIN)
export const deactivateService = async (id) => {
  return axiosClient.delete(`/service-packages/${id}`);
};