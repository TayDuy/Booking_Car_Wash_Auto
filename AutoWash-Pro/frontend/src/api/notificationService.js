import axiosClient, { API_BASE_URL } from './axiosClient';

const BASE_URL = `${API_BASE_URL}/notifications`;

export async function getAll(){
  const resp = await axiosClient.get('/notifications');
  return resp.data?.data || [];
}

export async function getUnread(){
  const resp = await axiosClient.get('/notifications/unread');
  return resp.data?.data || [];
}

export async function countUnread(){
  const resp = await axiosClient.get('/notifications/unread/count');
  return resp.data?.data || { count: 0 };
}

export async function createNotification(dto){
  const resp = await axiosClient.post('/notifications', dto);
  return resp.data?.data;
}

export async function createBulk(dto){
  const resp = await axiosClient.post('/notifications/bulk', dto);
  return resp.data?.data;
}

export async function markAsRead(id){
  const resp = await axiosClient.patch(`/notifications/${id}/read`);
  return resp.data;
}

export async function markAllRead(){
  const resp = await axiosClient.patch('/notifications/read-all');
  return resp.data;
}

export function subscribeSSE(onMessage) {
  let eventSource = null;
  let retryTimer = null;
  let active = true;
  let retryCount = 0;

  const MAX_RETRIES = 5;

  const handleRetry = () => {
    if (!active || retryCount >= MAX_RETRIES) {
      return;
    }

    retryCount += 1;

    const delay = Math.min(
      30000,
      1000 * Math.pow(2, retryCount)
    );

    console.log(
      `SSE reconnecting in ${delay / 1000}s ` +
        `(attempt ${retryCount}/${MAX_RETRIES})...`
    );

    retryTimer = window.setTimeout(() => {
      retryTimer = null;
      connect();
    }, delay);
  };

  const connect = async () => {
    if (!active) {
      return;
    }

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        return;
      }

      const response =
        await axiosClient.post("/auth/sse-ticket");

      /*
       * React StrictMode có thể cleanup effect trong lúc
       * request lấy ticket vẫn đang chạy.
       */
      if (!active) {
        return;
      }

      const ticket =
        response.data?.data || response.data;

      if (!ticket) {
        console.warn("SSE ticket không hợp lệ.");
        return;
      }

      eventSource = new EventSource(
        `${BASE_URL}/stream?ticket=${encodeURIComponent(
          ticket
        )}`
      );

      eventSource.onopen = () => {
        if (!active) {
          eventSource?.close();
          return;
        }

        retryCount = 0;
      };

      eventSource.onmessage = (event) => {
        if (!active) {
          return;
        }

        try {
          const notification = JSON.parse(event.data);
          onMessage(notification);
        } catch (error) {
          console.warn(
            "Không phân tích được dữ liệu SSE:",
            error
          );
        }
      };

      eventSource.onerror = (error) => {
        if (!active) {
          return;
        }

        console.warn(
          "SSE connection error. Retrying...",
          error
        );

        eventSource?.close();
        eventSource = null;

        handleRetry();
      };
    } catch (error) {
      if (!active) {
        return;
      }

      console.error(
        "SSE ticket request failed:",
        error
      );

      handleRetry();
    }
  };

  connect();

  return {
    close: () => {
      active = false;

      if (retryTimer !== null) {
        window.clearTimeout(retryTimer);
        retryTimer = null;
      }

      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }
    },
  };
}
