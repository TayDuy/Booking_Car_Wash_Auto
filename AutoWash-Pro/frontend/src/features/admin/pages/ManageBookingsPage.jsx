import { useEffect, useMemo, useState } from "react";
import { Eye, Search, XCircle, CheckCircle, CheckCheck } from "lucide-react";
import bookingApi from "../../../api/bookingApi";
import "./ManageBookingsPage.css";

export default function ManageBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    loadBookings();
  }, []);

  async function loadBookings() {
    setLoading(true);

    try {
      const response = await bookingApi.list();

      const result = response.data?.data || response.data || [];

      if (Array.isArray(result)) {
        setBookings(result);
      } else if (Array.isArray(result.content)) {
        setBookings(result.content);
      } else {
        setBookings([]);
      }
    } catch (error) {
      console.error("Load bookings failed:", error);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }

  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      const text = [
        booking.bookingCode,
        booking.customerName,
        booking.customer?.fullName,
        booking.branchName,
        booking.branch?.branchName,
        booking.serviceName,
        booking.status,
      ]
        .join(" ")
        .toLowerCase();

      const matchKeyword = text.includes(keyword.toLowerCase());

      const matchStatus =
        statusFilter === "all" || booking.status === statusFilter;

      return matchKeyword && matchStatus;
    });
  }, [bookings, keyword, statusFilter]);

  async function handleCancelBooking(booking) {
    const bookingId = booking.bookingId || booking.id;

    if (!bookingId) {
      alert("Không tìm thấy bookingId.");
      return;
    }

    const confirmCancel = window.confirm("Bạn có chắc muốn hủy đơn đặt lịch này không?");
    if (!confirmCancel) return;

    try {
      await bookingApi.cancelByStaff(bookingId);
      alert("Hủy booking thành công.");
      loadBookings();
    } catch (error) {
      console.error("Cancel booking failed:", error);
      alert("Hủy booking thất bại.");
    }
  }

  function getStatusClass(status) {
    if (status === "confirmed" || status === "completed") return "success";
    if (status === "cancelled" || status === "no_show") return "danger";
    if (status === "in_progress") return "info";
    return "warning";
  }

  async function handleViewBooking(booking) {
    const bookingId = booking.bookingId || booking.id;

    if (!bookingId) {
      alert("Không tìm thấy bookingId.");
      return;
    }

    setDetailLoading(true);

    try {
      const response = await bookingApi.getForStaff(bookingId);
      setSelectedBooking(response.data?.data || response.data);
    } catch (error) {
      console.error("Load booking detail failed:", error);
      alert("Không tải được chi tiết booking.");
    } finally {
      setDetailLoading(false);
    }
  }

  async function handleConfirmBooking(booking) {
    const bookingId = booking.bookingId || booking.id;

    if (!bookingId) {
      alert("Không tìm thấy bookingId.");
      return;
    }

    const ok = window.confirm("Bạn có chắc muốn xác nhận booking này không?");
    if (!ok) return;

    try {
      await bookingApi.confirm(bookingId);

      alert("Xác nhận booking thành công.");
      loadBookings();
    } catch (error) {
      console.error("Confirm booking failed:", error);
      alert("Xác nhận booking thất bại.");
    }
  }

  async function handleCompleteBooking(booking) {
    const bookingId = booking.bookingId || booking.id;

    if (!bookingId) {
      alert("Không tìm thấy bookingId.");
      return;
    }

    const ok = window.confirm("Bạn có chắc muốn hoàn thành booking này không?");
    if (!ok) return;

    try {
      await bookingApi.complete(bookingId);
      alert("Hoàn thành booking thành công.");
      loadBookings();
    } catch (error) {
      console.error("Complete booking failed:", error);
      alert("Hoàn thành booking thất bại.");
    }
  }

  return (
    <div className="manage-page">
      <div className="manage-header">
        <div>
          <h1>Quản lý đặt lịch</h1>
          <p>Theo dõi, tìm kiếm và xử lý các đơn đặt lịch trong hệ thống.</p>
        </div>

        <button className="refresh-btn" onClick={loadBookings}>
          Làm mới
        </button>
      </div>

      <div className="manage-toolbar">
        <div className="manage-search">
          <Search size={18} />
          <input
            type="text"
            placeholder="Tìm theo mã đơn, khách hàng, chi nhánh..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </div>

        <select
          className="manage-filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="in_progress">In progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
          <option value="no_show">No show</option>
        </select>
      </div>

      <div className="manage-card">
        {loading ? (
          <div className="empty-state">Đang tải danh sách đặt lịch...</div>
        ) : filteredBookings.length === 0 ? (
          <div className="empty-state">Không có đơn đặt lịch phù hợp.</div>
        ) : (
          <div className="booking-table-wrap">
            <table className="booking-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Mã đơn</th>
                  <th>Khách hàng</th>
                  <th>Chi nhánh</th>
                  <th>Dịch vụ</th>
                  <th>Thời gian</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>

              <tbody>
                {filteredBookings.map((booking, index) => (
                  <tr key={booking.bookingId || booking.id || index}>
                    <td>{index + 1}</td>
                    <td>{booking.bookingCode || "N/A"}</td>
                    <td>
                      {booking.customerName ||
                        booking.customer?.fullName ||
                        booking.customer ||
                        "N/A"}
                    </td>
                    <td>
                      {booking.branchName ||
                        booking.branch?.branchName ||
                        booking.branch ||
                        "N/A"}
                    </td>
                    <td>
                      {Array.isArray(booking.serviceNames)
                        ? booking.serviceNames.join(", ")
                        : booking.serviceName ||
                        booking.service?.serviceName ||
                        booking.service ||
                        "N/A"}
                    </td>
                    <td>
                      {booking.bookingDate
                        ? new Date(booking.bookingDate).toLocaleString("vi-VN")
                        : booking.startTime
                          ? new Date(booking.startTime).toLocaleString("vi-VN")
                          : booking.time || "N/A"}
                    </td>
                    <td>
                      <span className={`status-badge ${getStatusClass(booking.status)}`}>
                        {booking.status || "pending"}
                      </span>
                    </td>
                    <td>
                      <div className="action-group">
                        <button
                          className="action-btn view"
                          title="Xem chi tiết"
                          onClick={() => handleViewBooking(booking)}
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          className="action-btn confirm"
                          title="Xác nhận booking"
                          onClick={() => handleConfirmBooking(booking)}
                        >
                          <CheckCheck size={16} />
                        </button>
                        <button
                          className="action-btn complete"
                          title="Hoàn thành booking"
                          onClick={() => handleCompleteBooking(booking)}
                        >
                          <CheckCircle size={16} />
                        </button>
                        <button
                          className="action-btn cancel"
                          title="Hủy booking"
                          onClick={() => handleCancelBooking(booking)}
                        >
                          <XCircle size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {selectedBooking && (
        <div className="modal-backdrop">
          <div className="booking-detail-modal">
            <div className="modal-header">
              <h2>Chi tiết đặt lịch</h2>
              <button onClick={() => setSelectedBooking(null)}>×</button>
            </div>

            {detailLoading ? (
              <div className="empty-state">Đang tải chi tiết...</div>
            ) : (
              <div className="detail-content">
                <p><strong>Mã đơn:</strong> {selectedBooking.bookingCode || "N/A"}</p>
                <p><strong>Khách hàng:</strong> {selectedBooking.customerName || "N/A"}</p>
                <p><strong>SĐT:</strong> {selectedBooking.customerPhone || "N/A"}</p>
                <p><strong>Biển số:</strong> {selectedBooking.licensePlate || "N/A"}</p>
                <p><strong>Chi nhánh:</strong> {selectedBooking.branchName || "N/A"}</p>
                <p><strong>Trạng thái:</strong> {selectedBooking.status || "N/A"}</p>
                <p>
                  <strong>Thời gian:</strong>{" "}
                  {selectedBooking.bookingDate
                    ? new Date(selectedBooking.bookingDate).toLocaleString("vi-VN")
                    : "N/A"}
                </p>
                <p><strong>Ghi chú:</strong> {selectedBooking.note || "Không có"}</p>
                <p>
                  <strong>Tổng tiền:</strong>{" "}
                  {Number(selectedBooking.totalAmount || 0).toLocaleString("vi-VN")} đ
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}