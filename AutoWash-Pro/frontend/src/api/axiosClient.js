import axios from "axios";

const axiosClient = axios.create({
  baseURL: "http://localhost:8080/api/v1",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

axiosClient.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem("token") || localStorage.getItem("accessToken");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token);
    }
  });

  failedQueue = [];
};

function clearAuthStorage() {
  localStorage.removeItem("token");
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("username");
  localStorage.removeItem("role");
  localStorage.removeItem("userId");
  localStorage.removeItem("customerId");
}

function redirectToLanding() {
  if (window.location.pathname !== "/") {
    window.location.href = "/";
  }
}

function isAuthPublicRequest(url = "") {
  return (
    url.includes("/auth/login") ||
    url.includes("/auth/register") ||
    url.includes("/auth/send-otp") ||
    url.includes("/auth/verify-otp") ||
    url.includes("/auth/google")
  );
}

axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (!originalRequest) {
      return Promise.reject(error);
    }

    const requestUrl = originalRequest.url || "";

    // Quan trọng:
    // Login sai cũng trả 401, nhưng không được redirect về Landing.
    // Để LoginPage tự hiện lỗi trên form.
    if (isAuthPublicRequest(requestUrl)) {
      return Promise.reject(error);
    }

    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axiosClient(originalRequest);
          })
          .catch((queueError) => Promise.reject(queueError));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem("refreshToken");

      if (refreshToken) {
        try {
          const response = await axios.post(
            "http://localhost:8080/api/v1/auth/refresh",
            {
              refreshToken,
            }
          );

          const newAccessToken = response.data?.accessToken;
          const newRefreshToken = response.data?.refreshToken;

          if (!newAccessToken) {
            throw new Error("Refresh response không có accessToken");
          }

          localStorage.setItem("token", newAccessToken);
          localStorage.setItem("accessToken", newAccessToken);

          if (newRefreshToken) {
            localStorage.setItem("refreshToken", newRefreshToken);
          }

          axiosClient.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

          processQueue(null, newAccessToken);

          return axiosClient(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError, null);

          clearAuthStorage();
          redirectToLanding();

          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      clearAuthStorage();
      redirectToLanding();
    }

    return Promise.reject(error);
  }
);

export default axiosClient;