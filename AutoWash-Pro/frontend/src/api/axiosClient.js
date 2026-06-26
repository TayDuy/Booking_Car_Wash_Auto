import axios from 'axios'

const axiosClient = axios.create({
  baseURL: 'http://localhost:8080/api',
    // baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

// Request interceptor: attach JWT if present
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor: handle global errors
axiosClient.interceptors.response.use(

  response=>response,

  error=>{
      if(error.response?.status===401){
          console.log("Unauthorized");
      }
      return Promise.reject(error);
  }
);

export default axiosClient
