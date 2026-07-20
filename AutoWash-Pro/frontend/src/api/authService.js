import axiosClient from "./axiosClient";

export async function login(username, password) {
  const response = await axiosClient.post("/auth/login", {
    username,
    password,
  });

  return response.data.data;
}

export async function register(username, password, email, fullName, phone) {
  const response = await axiosClient.post("/auth/register", {
    username,
    password,
    email,
    fullName,
    phone,
  });

  return response.data.data;
}

export async function sendOtp(email) {
  const response = await axiosClient.post("/auth/send-otp", { email });
  return response.data;
}

export async function verifyOtp(email, otp, purpose = "GENERAL") {
  const response = await axiosClient.post("/auth/verify-otp", {
    email,
    otp,
    purpose,
  });
  return response.data;
}

export async function loginWithGoogle(supabaseToken) {
  const response = await axiosClient.post("/auth/google", { supabaseToken });
  return response.data.data;
}

export async function changePassword(oldPassword, newPassword) {
  const response = await axiosClient.put("/auth/change-password", {
    oldPassword,
    newPassword,
  });
  return response.data;
}

export async function logoutFromServer() {
  try {
    await axiosClient.post("/auth/logout");
  } catch (error) {
    console.warn("Logout server error:", error);
  } finally {
    logout();
  }
}

export async function requestForgotPassword(email) {
  const response = await axiosClient.post("/auth/forgot-password/request", {
    email: email,
  });
  return response.data;
}

export async function resetForgotPassword(email, otp, newPassword) {
  const response = await axiosClient.post("/auth/forgot-password/reset", {
    email: email,
    otp: otp,
    newPassword: newPassword,
  });
  return response.data;
}

export function saveAuth(result) {
  // refreshToken KHÔNG còn nằm trong result nữa - backend đã set nó vào
  // HttpOnly cookie (JS không đọc được, không cần và không nên lưu ở đây).
  const accessToken = result?.accessToken || "";
  const user = result?.user || {};

  localStorage.setItem("token", accessToken);

  localStorage.setItem("username", user?.username || "");
  localStorage.setItem("fullName", user?.fullName || "");
  localStorage.setItem("role", String(user?.role || "").toUpperCase());
  localStorage.setItem("userId", user?.userId || "");
  localStorage.setItem("customerId", user?.customerId || "");
}

export function logout() {
  // Cookie refreshToken được xóa ở server (xem logoutFromServer -> POST /auth/logout).
  // Ở đây chỉ dọn dữ liệu phía client.
  localStorage.removeItem("token");
  localStorage.removeItem("accessToken");
  localStorage.removeItem("username");
  localStorage.removeItem("fullName");
  localStorage.removeItem("role");
  localStorage.removeItem("roles");
  localStorage.removeItem("userId");
  localStorage.removeItem("customerId");
  localStorage.removeItem("employeeId");
  localStorage.removeItem("branchId");
  localStorage.removeItem("branchName");
  localStorage.removeItem("permissions");
  localStorage.removeItem("user");
}

export function isLoggedIn() {
  return Boolean(localStorage.getItem("token"));
}

export function getUsername() {
  return localStorage.getItem("username");
}

export function getRole() {
  return localStorage.getItem("role");
}

export function getUserId() {
  return localStorage.getItem("userId");
}

export function getCustomerId() {
  return localStorage.getItem("customerId");
}