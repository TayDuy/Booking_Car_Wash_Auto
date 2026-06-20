import axios from "axios";

const API_URL = "http://localhost:8080/api/v1";

const getToken = () => {
  return localStorage.getItem("token");
};

export const createBooking = async (bookingData) => {
  return axios.post(
    `${API_URL}/bookings`,
    bookingData,
    {
      headers: {
        Authorization: `Bearer ${getToken()}`
      }
    }
  );
};

export const getMyBookings = async (customerId) => {
  return axios.get(
    `${API_URL}/bookings/my/${customerId}`,
    {
      headers: {
        Authorization: `Bearer ${getToken()}`
      }
    }
  );
};