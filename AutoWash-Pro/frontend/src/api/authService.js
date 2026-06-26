import axios from "axios";

const API_URL = "http://localhost:8080/api/v1/auth";

export async function login(username, password){
    const respone = await axios.post(`${API_URL}/login`,{
        username: username,
        password: password,
    });
    return respone.data;
}

export async function loginWithGoogle(supabaseToken) {
    const response = await axios.post(`${API_URL}/google`, {
        supabaseToken: supabaseToken
    });
    return response.data;
}

export async function register(username, password, email, fullName, phone){
    const respone = await axios.post(`${API_URL}/register`,{
        username: username,
        password: password,
        email: email,
        fullName: fullName,
        phone: phone
    });
    return respone.data;
}

export async function sendOtp(phone){
    const respone = await axios.post(`${API_URL}/send-otp`,{
        phone: phone,
    });
    return respone.data;
}

export async function verifyOtp(phone, otp) {
    const respone = await axios.post(`${API_URL}/verify-otp`,{
        phone: phone,
        otp: otp
    });
    return respone.data;
}

export function saveAuth(result){
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

export function logout(){
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("username");
    localStorage.removeItem("role");
    localStorage.removeItem("userId");
    localStorage.removeItem("customerId");
}

export function isLoggedIn(){
    return localStorage.getItem("token") !== null;
}

export function getUsername(){
    return localStorage.getItem("username");
}

export function getRole(){
    return localStorage.getItem("role");
}