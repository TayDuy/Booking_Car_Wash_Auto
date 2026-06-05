import axios from "axios";

const API_URL = "http://localhost:8080/api/auth";

export async function login(username, password){
    const respone = await axios.post(`${API_URL}/login`,{
        username: username,
        password: password,
    });
    return respone.data;
}

export async function register(username, password, email){
    const respone = await axios.post(`${API_URL}/register`,{
        username: username,
        password: password,
        email: email,
    });
    return respone.data;
}

export function saveAuth(result){
    localStorage.setItem("token", result.token);
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