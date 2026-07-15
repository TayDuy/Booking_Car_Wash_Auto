import axiosClient from './axiosClient'
import { getCustomerId } from './authService'

const bookingApi = {
  // Customer APIs
  // FIX: backend (BookingController) KHÔNG có prefix "/customer" — route thật là
  // "/api/v1/bookings/...". Gọi sai path "/customer/bookings" khiến Spring không
  // match được controller nào, rơi vào ResourceHttpRequestHandler và ném
  // NoResourceFoundException -> lộ ra như lỗi 500 phía client.
  //
  // GET /api/v1/bookings/my/{customerId} yêu cầu customerId trên path (không phải
  // query param "status" như cũ). customerId được lưu sẵn trong localStorage lúc
  // đăng nhập (xem authService.saveAuth), nên mặc định lấy từ đó nếu không truyền vào.
  myBookings: (customerId = getCustomerId()) =>
      axiosClient.get(`/bookings/my/${customerId}`),
  get: (id) => axiosClient.get(`/bookings/${id}`),
  create: (payload) => axiosClient.post('/bookings', payload),
  // Backend expose hủy booking bằng method DELETE, không phải PATCH.
  cancel: (id) => axiosClient.delete(`/bookings/${id}/cancel`),
  // FIXME: backend (BookingController) chưa có endpoint reschedule cho CUSTOMER
  // (chỉ có create/getMy/getById/cancel). Gọi hàm này sẽ luôn 404/500 cho tới khi
  // backend bổ sung PUT /api/v1/bookings/{bookingId}/reschedule.
  reschedule: (id, payload) => axiosClient.put(`/bookings/${id}/reschedule`, payload),

  // Staff/Admin APIs
  list: (params) => axiosClient.get('/staff/bookings', { params }),
  // FIXME: backend chưa có GET /staff/bookings/{id} (BookingController chỉ có
  // getBookingById cho CUSTOMER, có kiểm tra quyền sở hữu). Cần bổ sung endpoint
  // backend tương ứng thì "Xem chi tiết" ở trang admin mới hoạt động được.
  getForStaff: (id) => axiosClient.get(`/staff/bookings/${id}`),
  update: (id, payload) => axiosClient.put(`/staff/bookings/${id}`, payload),
  // FIXME: backend chưa có action "confirm" / "check-in" cho booking
  // (BookingService chỉ có create/update/cancel/complete). Cần bổ sung ở backend.
  confirm: (id) => axiosClient.patch(`/staff/bookings/${id}/confirm`),
  checkIn: (id) => axiosClient.patch(`/staff/bookings/${id}/check-in`),
  complete: (id) => axiosClient.patch(`/staff/bookings/${id}/complete`),
  cancelByStaff: (id) => axiosClient.delete(`/staff/bookings/${id}/cancel`),

  // Admin-only APIs
  // NOTE: backend (BookingController) không có prefix "/admin/bookings" riêng —
  // ADMIN và STAFF dùng chung nhóm "/staff/bookings" (phân quyền bằng @PreAuthorize).
  // Đã sửa lại cho khớp BookingController.java thật, tránh gọi API 404.
  adminList: (params) => axiosClient.get('/staff/bookings', { params }),
  adminUpdate: (id, payload) => axiosClient.put(`/staff/bookings/${id}`, payload),
  // Backend expose hủy booking bằng method DELETE, không phải PATCH.
  adminCancel: (id) => axiosClient.delete(`/staff/bookings/${id}/cancel`),
}

export default bookingApi