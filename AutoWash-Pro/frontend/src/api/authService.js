import axios from "axios";

const API_URL = "http://localhost:8080/api/v1/auth";

export async function login(username, password){
    const response = await axios.post(`${API_URL}/login`,{
        username: username,
        password: password,
    });
    return respone.data;
}

export async function register(payload) {
    const response = await axios.post(`${API_URL}/register`, payload);
    return response.data;
}

export function saveAuth(result){
    localStorage.setItem("token", result.accessToken);
    localStorage.setItem("username", result.username);
    localStorage.setItem("role", result.role);
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