import axiosClient from "./axiosClient";

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

export async function sendOtp(email) {
    const respone = await axiosClient.post(`${API_URL}/send-otp`, {
        email: email,
    });
    return respone.data;
}

export async function verifyOtp(email, otp) {
    const respone = await axiosClient.post(`${API_URL}/verify-otp`, {
        email: email,
        otp: otp
    });
    return respone.data;
}

export async function requestForgotPassword(email) {
    const respone = await axiosClient.post(`${API_URL}/forgot-password/request`, {
        email: email,
    });
    return respone.data;
}

export async function resetForgotPassword(email, otp, newPassword) {
    const respone = await axiosClient.post(`${API_URL}/forgot-password/reset`, {
        email: email,
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
