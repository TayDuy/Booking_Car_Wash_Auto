import axiosClient from './axiosClient';

// Lấy danh sách hạng thành viên đang active, sắp xếp từ cao xuống thấp.
// Dùng cho dropdown "gửi thông báo theo hạng" ở trang Admin Notification.
export async function getActiveTiers() {
    const resp = await axiosClient.get('/loyalty-tiers');
    return resp.data?.data || [];
}