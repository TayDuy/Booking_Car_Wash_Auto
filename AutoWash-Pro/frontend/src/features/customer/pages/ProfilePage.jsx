import { Link, useParams } from "react-router-dom";

function BookingDetailPage() {
  const { bookingId } = useParams();

  return (
    <div className="app-container" style={{ padding: "72px 0" }}>
      <div className="card" style={{ padding: "32px" }}>
        <span className="status-badge status-primary">Chi tiết booking</span>

        <h1 style={{ marginTop: "20px" }}>Booking #{bookingId}</h1>

        <p style={{ color: "var(--color-text-muted)", lineHeight: 1.7 }}>
          Đây là trang chi tiết booking tạm thời. Sau này sẽ nối API để lấy dữ
          liệu booking theo id.
        </p>

        <Link to="/customer/history" className="primary-button">
          Quay lại lịch sử
        </Link>
      </div>
    </div>
  );
}

export default BookingDetailPage;