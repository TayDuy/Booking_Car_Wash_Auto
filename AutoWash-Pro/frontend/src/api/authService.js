import axios from "axios";

const API_URL = "http://localhost:8080/api/v1/auth";

export async function login(email, password){
    const response = await axios.post(`${API_URL}/login`,{
        email,
        password
    });

    return response.data;
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

    localStorage.setItem("token", result.accessToken);

    localStorage.setItem("userId", result.userId);

    localStorage.setItem("email", result.email);

    localStorage.setItem("role", result.role);

    localStorage.setItem("fullName", result.fullName);
}

export function logout(){
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("role");
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