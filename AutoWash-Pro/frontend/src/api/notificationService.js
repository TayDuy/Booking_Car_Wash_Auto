import axios from 'axios';

const BASE = 'http://localhost:8080/api/v1/notifications';

function authHeader(){
  const token = localStorage.getItem('token');
  return token ? { Authorization: 'Bearer ' + token } : {};
}

export async function getAll(){
  const resp = await axios.get(BASE, { headers: authHeader() });
  return resp.data?.data || [];
}

export async function getUnread(){
  const resp = await axios.get(`${BASE}/unread`, { headers: authHeader() });
  return resp.data?.data || [];
}

export async function countUnread(){
  const resp = await axios.get(`${BASE}/unread/count`, { headers: authHeader() });
  return resp.data?.data || { count: 0 };
}

export async function createNotification(dto){
  const resp = await axios.post(BASE, dto, { headers: { ...authHeader(), 'Content-Type': 'application/json' } });
  return resp.data?.data;
}

export async function createBulk(dto){
  const resp = await axios.post(`${BASE}/bulk`, dto, { headers: { ...authHeader(), 'Content-Type': 'application/json' } });
  return resp.data?.data;
}

export async function markAsRead(id){
  const resp = await axios.patch(`${BASE}/${id}/read`, null, { headers: authHeader() });
  return resp.data;
}

export async function markAllRead(){
  const resp = await axios.patch(`${BASE}/read-all`, null, { headers: authHeader() });
  return resp.data;
}

export function subscribeSSE(onMessage){
  const token = localStorage.getItem('token');
  const headers = token ? `?token=${token}` : '';
  const es = new EventSource(`${BASE}/stream${headers}`);
  es.onmessage = (e) => {
    try{ const d = JSON.parse(e.data); onMessage(d); }catch(err){ console.warn('SSE parse', err); }
  };
  es.onerror = (err) => { console.warn('SSE error', err); };
  return es;
}
