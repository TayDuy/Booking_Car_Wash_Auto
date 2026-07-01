import { Link } from "react-router-dom";
import "./BookingHistoryPage.css";

const bookings = [
  {
    id: "BK001",
    branchName: "WashFlow Kim Giang",
    serviceName: "Rửa xe cao cấp",
    date: "2026-06-28",
    time: "09:00",
    price: 180000,
    status: "CONFIRMED",
  },
  {
    id: "BK002",
    branchName: "WashFlow Nguyễn Trãi",
    serviceName: "Rửa xe cơ bản",
    date: "2026-06-20",
    time: "14:00",
    price: 80000,
    status: "COMPLETED",
  },
  {
    id: "BK003",
    branchName: "WashFlow Cầu Giấy",
    serviceName: "Chăm sóc nội thất",
    date: "2026-06-15",
    time: "10:00",
    price: 250000,
    status: "CANCELLED",
  },
];

function formatCurrency(value) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);
}

function getStatusInfo(status) {
  switch (status) {
    case "CONFIRMED":
      return {
        label: "Đã xác nhận",
        className: "status-badge status-primary",
      };
    case "COMPLETED":
      return {
        label: "Hoàn thành",
        className: "status-badge status-success",
      };
    case "CANCELLED":
      return {
        label: "Đã hủy",
        className: "status-badge status-danger",
      };
    default:
      return {
        label: "Đang chờ",
        className: "status-badge status-warning",
      };
  }
}

function BookingHistoryPage() {
  return (
    <div className="booking-history-page">
      <section className="history-hero">
        <div className="app-container history-hero-inner">
          <div>
            <span className="history-badge">Lịch sử đặt lịch</span>

            <h1>Theo dõi các lịch rửa xe của bạn</h1>

            <p>
              Xem lại các lịch đã đặt, trạng thái xử lý, chi nhánh, dịch vụ và
              chi phí cho từng lần sử dụng.
            </p>
          </div>

          <Link to="/customer/booking" className="primary-button">
            Đặt lịch mới
          </Link>
        </div>
      </section>

      <section className="history-section">
        <div className="app-container">
          <div className="history-summary-grid">
            <div className="history-summary-card card">
              <span>Tổng booking</span>
              <strong>12</strong>
            </div>

            <div className="history-summary-card card">
              <span>Đã hoàn thành</span>
              <strong>8</strong>
            </div>

            <div className="history-summary-card card">
              <span>Đang chờ/xác nhận</span>
              <strong>3</strong>
            </div>

            <div className="history-summary-card card">
              <span>Đã hủy</span>
              <strong>1</strong>
            </div>
          </div>

          <div className="history-content card">
            <div className="history-content-header">
              <div>
                <h2>Danh sách booking</h2>
                <p>Các lịch đặt gần đây của bạn.</p>
              </div>

              <select className="history-filter" defaultValue="ALL">
                <option value="ALL">Tất cả trạng thái</option>
                <option value="PENDING">Đang chờ</option>
                <option value="CONFIRMED">Đã xác nhận</option>
                <option value="COMPLETED">Hoàn thành</option>
                <option value="CANCELLED">Đã hủy</option>
              </select>
            </div>

            <div className="history-list">
              {bookings.map((booking) => {
                const statusInfo = getStatusInfo(booking.status);

                return (
                  <article className="history-item" key={booking.id}>
                    <div className="history-item-main">
                      <div className="history-booking-icon">🚘</div>

                      <div>
                        <div className="history-item-title">
                          <h3>{booking.serviceName}</h3>
                          <span className={statusInfo.className}>
                            {statusInfo.label}
                          </span>
                        </div>

                        <p>{booking.branchName}</p>

                        <div className="history-meta">
                          <span>📅 {booking.date}</span>
                          <span>⏰ {booking.time}</span>
                          <span>💰 {formatCurrency(booking.price)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="history-actions">
                      <Link
                        to={`/customer/booking/${booking.id}`}
                        className="history-detail-btn"
                      >
                        Xem chi tiết
                      </Link>

                      {booking.status === "CONFIRMED" && (
                        <button className="history-cancel-btn" type="button">
                          Hủy lịch
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default BookingHistoryPage;