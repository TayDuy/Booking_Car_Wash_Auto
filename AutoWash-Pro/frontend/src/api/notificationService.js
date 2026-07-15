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

export async function deleteNotification(id){
  const resp = await axiosClient.delete(`/notifications/${id}`);
  return resp.data;
}

export async function deleteAllNotifications(){
  const resp = await axiosClient.delete('/notifications');
  return resp.data;
}

export async function adminRevoke(id){
  const resp = await axiosClient.delete(`/notifications/admin/${id}`);
  return resp.data;
}

export function subscribeSSE(onMessage, onRevoke) {
  let es = null;
  let active = true;
  let retryCount = 0;
  const MAX_RETRIES = 5;

  const connect = async () => {
    if (!active) return;
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const resp = await axiosClient.post('/auth/sse-ticket');
      const ticket = resp.data?.data || resp.data;

      es = new EventSource(`${BASE_URL}/stream?ticket=${ticket}`);

      es.onopen = () => {
        retryCount = 0;
      };

      es.addEventListener('notification', (e) => {
        try {
          const d = JSON.parse(e.data);
          onMessage(d);
        } catch (err) {
          console.warn('SSE parse', err);
        }
      });

      es.addEventListener('notification-revoked', (e) => {
        try {
          const d = JSON.parse(e.data);
          onRevoke?.(d.notificationId);
        } catch (err) {
          console.warn('SSE parse (revoke)', err);
        }
      });

      es.onerror = (err) => {
        console.warn('SSE connection error. Closing and retrying...', err);
        es.close();
        handleRetry();
      };
    } catch (err) {
      console.error('SSE ticket request failed.', err);
      handleRetry();
    }
  };

  const handleRetry = () => {
    if (retryCount >= MAX_RETRIES) {
      console.warn(`SSE subscription: reached max retry limit (${MAX_RETRIES}). Stopping auto-reconnect.`);
      return;
    }
    retryCount++;
    const delay = Math.min(30000, 1000 * Math.pow(2, retryCount));
    console.log(`SSE reconnecting in ${delay / 1000}s (attempt ${retryCount}/${MAX_RETRIES})...`);
    setTimeout(connect, delay);
  };

  connect();

  return {
    close: () => {
      active = false;
      if (es) es.close();
    }
  };
}