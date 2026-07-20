import axiosClient from "./axiosClient";

export const ratingApi = {
    createRating: (bookingId, data) => axiosClient.post(`/bookings/${bookingId}/rating`, data),
    getRating: (bookingId) => axiosClient.get(`/bookings/${bookingId}/rating`),
    getAllRatingsForAdmin: (params) => axiosClient.get(`/admin/ratings`, { params }),
    getAllRatingsForEmployee: (params) => axiosClient.get(`/employee/ratings`, { params }),
};

export default ratingApi;
