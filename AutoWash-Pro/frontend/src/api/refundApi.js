// frontend/src/api/refundApi.js
import axiosClient from "./axiosClient";

const refundApi = {
    lookupByBookingCode: (bookingCode) =>
        axiosClient.get("/refunds/lookup", { params: { bookingCode } }),

    create: (payload) => axiosClient.post("/refunds", payload),

    // Khách hàng tự gửi yêu cầu hoàn tiền (popup xác nhận, chỉ nhập lý do).
    // Áp dụng cho cả booking thanh toán online (VNPAY/PayPal) và tại quầy (cash/pos).
    requestSelf: (paymentId, reason) =>
        axiosClient.post("/refunds/self", { paymentId, reason }),

    // Danh sách yêu cầu hoàn tiền mà chính khách hàng đã tự gửi.
    mySelfRequests: () => axiosClient.get("/refunds/self/mine"),

    list: (status) => {
        const params = status && status !== "all" ? { status } : {};
        return axiosClient.get("/refunds", { params });
    },

    mine: () => axiosClient.get("/refunds/mine"),

    detail: (id) => axiosClient.get(`/refunds/${id}`),

    markProcessing: (id) => axiosClient.patch(`/refunds/${id}/processing`),

    approve: (id, adminNote) =>
        axiosClient.patch(`/refunds/${id}/approve`, { adminNote }),

    reject: (id, adminNote) =>
        axiosClient.patch(`/refunds/${id}/reject`, { adminNote }),

    complete: (id, completionNote) =>
        axiosClient.patch(`/refunds/${id}/complete`, { completionNote }),
};

export default refundApi;