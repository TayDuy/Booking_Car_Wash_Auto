import axiosClient from './axiosClient';

const BASE_URL = 'http://localhost:8080/api/v1/notifications';

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
  const token = localStorage.getItem('token');
  const headers = token ? `?token=${token}` : '';
  const es = new EventSource(`${BASE_URL}/stream${headers}`);
  es.onmessage = (e) => {
    try{ const d = JSON.parse(e.data); onMessage(d); }catch(err){ console.warn('SSE parse', err); }
  };
  es.onerror = (err) => { console.warn('SSE error', err); };
  return es;
}
