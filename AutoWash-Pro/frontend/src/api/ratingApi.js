import axiosClient from "./axiosClient";

export const ratingApi = {
    createRating: (bookingId, data) => axiosClient.post(`/bookings/${bookingId}/rating`, data),
    getRating: (bookingId) => axiosClient.get(`/bookings/${bookingId}/rating`),
};

export default ratingApi;
