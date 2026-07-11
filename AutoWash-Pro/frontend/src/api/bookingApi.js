import axiosClient from './axiosClient'

const bookingApi = {
  // Customer APIs
  myBookings: (status) => axiosClient.get('/customer/bookings/my', { params: status ? { status } : {} }),
  get: (id) => axiosClient.get(`/customer/bookings/${id}`),
  create: (payload) => axiosClient.post('/customer/bookings', payload),
  cancel: (id) => axiosClient.patch(`/customer/bookings/${id}/cancel`),
  reschedule: (id, payload) => axiosClient.put(`/customer/bookings/${id}/reschedule`, payload),

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