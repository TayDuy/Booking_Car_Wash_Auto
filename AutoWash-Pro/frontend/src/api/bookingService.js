import axiosClient from "./axiosClient";

export const createBooking = async (bookingData) => {
  return axiosClient.post("/bookings", bookingData);
};

export const getMyBookings = async (customerId) => {
  return axiosClient.get(`/bookings/my/${customerId}`);
};