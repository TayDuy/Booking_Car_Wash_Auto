import axios from "axios";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api/v1";
export const BACKEND_ROOT_URL = API_BASE_URL.replace("/api/v1", "");

const axiosClient = axios.create({
    baseURL: API_BASE_URL,
    // QUAN TRỌNG: nếu không có timeout, khi backend bị treo (ví dụ backend
    // đang chờ vô thời hạn để gọi ra Supabase) thì request phía frontend
    // (ví dụ /auth/google) cũng sẽ chờ MÃI MÃI, khiến màn hình bị treo.
    timeout: 60000,
    headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
    },
    // QUAN TRỌNG: bắt buộc để trình duyệt gửi kèm HttpOnly cookie (refreshToken)
    // tới backend. Nếu thiếu, /auth/refresh sẽ luôn thất bại vì cookie không được gửi.
    withCredentials: true,
});

axiosClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => {
        throw error;
    }
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
    // refreshToken không còn trong localStorage (đã chuyển sang HttpOnly cookie,
    // được xóa phía server khi gọi /auth/logout hoặc khi rotate thất bại).
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("role");
    localStorage.removeItem("userId");
    localStorage.removeItem("customerId");
}

function redirectToLogin() {
    if (window.location.pathname !== "/auth/login") {
        window.location.href = "/auth/login";
    }
}

function isAuthPublicRequest(url = "") {
    return (
        url.includes("/auth/") ||
        url.includes("/notifications/stream") ||
        url.includes("/service-packages/active")
    );
}

axiosClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (!originalRequest) {
            throw error;
        }

        const requestUrl = originalRequest.url || "";

        if (isAuthPublicRequest(requestUrl)) {
            throw error;
        }

        if (
            error.response?.status === 401 &&
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
                    .catch((queueError) => { throw queueError; });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                // Không cần gửi refreshToken trong body nữa - trình duyệt tự đính kèm
                // HttpOnly cookie "refreshToken" nhờ withCredentials: true.
                const response = await axios.post(
                    `${API_BASE_URL}/auth/refresh`,
                    {},
                    { withCredentials: true }
                );

                const responseData = response.data?.data || response.data;
                const newAccessToken = responseData?.accessToken;

                if (!newAccessToken) {
                    throw new Error("Refresh response không có accessToken");
                }

                localStorage.setItem("token", newAccessToken);

                axiosClient.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

                processQueue(null, newAccessToken);

                return axiosClient(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);

                clearAuthStorage();
                redirectToLogin();

                throw refreshError;
            } finally {
                isRefreshing = false;
            }
        }

        throw error;
    }
);

export default axiosClient;