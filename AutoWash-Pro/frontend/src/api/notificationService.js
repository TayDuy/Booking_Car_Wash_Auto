import axiosClient, { API_BASE_URL } from './axiosClient';
import axios from 'axios';

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

export function subscribeSSE(onMessage){
  let es = null;
  let closed = false;
  let retryCount = 0;
  const MAX_RETRIES = 3;

  function open(){
    const token = localStorage.getItem('token');
    const headers = token ? `?token=${token}` : '';
    es = new EventSource(`${BASE_URL}/stream${headers}`);

    es.onmessage = (e) => {
      try{ const d = JSON.parse(e.data); onMessage(d); }catch(err){ console.warn('SSE parse', err); }
    };

    es.onopen = () => { retryCount = 0; };

    es.onerror = async (err) => {
      console.warn('SSE error', err);
      if (closed) return;
      es.close();

      if (retryCount >= MAX_RETRIES) {
        console.warn('SSE: đã thử lại tối đa số lần, dừng kết nối.');
        return;
      }
      retryCount += 1;

      // Token hết hạn (15 phút) → gọi /auth/refresh để lấy token mới rồi mở lại kết nối,
      // thay vì giữ nguyên token cũ và bị 401 lặp lại liên tục.
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) return;

      try {
        const res = await axios.post('http://localhost:8080/api/v1/auth/refresh', { refreshToken });
        const { accessToken, refreshToken: newRefreshToken } = res.data.data;
        localStorage.setItem('token', accessToken);
        if (newRefreshToken) localStorage.setItem('refreshToken', newRefreshToken);

        if (!closed) {
          setTimeout(open, 500);
        }
      } catch (refreshErr) {
        console.warn('SSE: refresh token thất bại, dừng kết nối thông báo real-time.', refreshErr);
      }
    };
  }

  open();

  // Trả về object có .close() giống EventSource để chỗ gọi (SiteHeader) dùng được như cũ
  return {
    close(){
      closed = true;
      es?.close?.();
    }
  };
}