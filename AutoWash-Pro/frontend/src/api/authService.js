import axiosClient from "./axiosClient";

<<<<<<< HEAD
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

export async function sendOtp(phone) {
  const response = await axiosClient.post("/auth/send-otp", {
    phone,
  });

  return response.data;
}

export async function verifyOtp(phone, otp) {
  const response = await axiosClient.post("/auth/verify-otp", {
    phone,
    otp,
  });

  return response.data;
}

export async function loginWithGoogle(supabaseToken) {
  const response = await axiosClient.post("/auth/google", {
    supabaseToken,
  });

  return response.data.data;
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

export function saveAuth(result) {
  console.log("saveAuth result:", result);

  const accessToken = result?.accessToken || "";
  const refreshToken = result?.refreshToken || "";
  const user = result?.user || {};

  localStorage.setItem("token", accessToken);
  localStorage.setItem("accessToken", accessToken);
  localStorage.setItem("refreshToken", refreshToken);

  localStorage.setItem("username", user?.username || "");
  localStorage.setItem("role", String(user?.role || "").toUpperCase());
  localStorage.setItem("userId", user?.userId || "");
  localStorage.setItem("customerId", user?.customerId || "");
}

export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("username");
  localStorage.removeItem("role");
  localStorage.removeItem("userId");
  localStorage.removeItem("customerId");
}

export function isLoggedIn() {
  return Boolean(
    localStorage.getItem("token") || localStorage.getItem("accessToken")
  );
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
=======
const API_URL = "/auth";

export async function login(username, password) {
    const respone = await axiosClient.post(`${API_URL}/login`, {
        username: username,
        password: password,
    });
    return respone.data;
}

export async function loginWithGoogle(supabaseToken) {
    const response = await axiosClient.post(`${API_URL}/google`, {
        supabaseToken: supabaseToken
    });
    return response.data;
}

export async function register(username, password, email, fullName, phone) {
    const respone = await axiosClient.post(`${API_URL}/register`, {
        username: username,
        password: password,
        email: email,
        fullName: fullName,
        phone: phone
    });
    return respone.data;
}

export async function sendOtp(phone) {
    const respone = await axiosClient.post(`${API_URL}/send-otp`, {
        phone: phone,
    });
    return respone.data;
}

export async function verifyOtp(phone, otp) {
    const respone = await axiosClient.post(`${API_URL}/verify-otp`, {
        phone: phone,
        otp: otp
    });
    return respone.data;
}

export async function requestForgotPassword(phone) {
    const respone = await axiosClient.post(`${API_URL}/forgot-password/request`, {
        phone: phone,
    });
    return respone.data;
}

export async function resetForgotPassword(phone, otp, newPassword) {
    const respone = await axiosClient.post(`${API_URL}/forgot-password/reset`, {
        phone: phone,
        otp: otp,
        newPassword: newPassword,
    });
    return respone.data;
}

export function saveAuth(result) {
    localStorage.setItem(
        "token",
        result.accessToken
    );

    localStorage.setItem(
        "refreshToken",
        result.refreshToken || ""
    );

    localStorage.setItem(
        "username",
        result.user?.username || ""
    );

    localStorage.setItem(
        "role",
        result.user?.role || ""
    );

    localStorage.setItem(
        "userId",
        result.user?.userId || ""
    );

    localStorage.setItem(
        "customerId",
        result.user?.customerId || ""
    );
}

export function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("username");
    localStorage.removeItem("role");
    localStorage.removeItem("userId");
    localStorage.removeItem("customerId");
}

export function isLoggedIn() {
    return localStorage.getItem("token") !== null;
}

export function getUsername() {
    return localStorage.getItem("username");
}

export function getRole() {
    return localStorage.getItem("role");
}
>>>>>>> origin/develop
