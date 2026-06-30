import { Link } from "react-router-dom";
import "../booking/pages/BookingSuccessPage.css";

function BookingSuccessPage() {
  const bookingDraft = JSON.parse(localStorage.getItem("bookingDraft") || "{}");

  return (
    <div className="booking-success-page">
      <div className="app-container">
        <div className="booking-success-card card">
          <div className="success-icon">✓</div>

          <h1>Đặt lịch thành công</h1>

          <p>
            Lịch rửa xe của bạn đã được ghi nhận. Vui lòng đến đúng giờ hoặc
            theo dõi trạng thái trong lịch sử đặt lịch.
          </p>

          <div className="success-summary">
            <div>
              <span>Chi nhánh</span>
              <strong>{bookingDraft?.branch?.name || "WashFlow Pro"}</strong>
            </div>

            <div>
              <span>Dịch vụ</span>
              <strong>{bookingDraft?.service?.name || "Rửa xe"}</strong>
            </div>

            <div>
              <span>Ngày</span>
              <strong>{bookingDraft?.date || "Chưa có"}</strong>
            </div>

            <div>
              <span>Giờ</span>
              <strong>{bookingDraft?.time || "Chưa có"}</strong>
            </div>
          </div>

          <div className="success-actions">
            <Link to="/customer/history" className="primary-button">
              Xem lịch sử đặt lịch
            </Link>

            <Link to="/customer/home" className="secondary-button">
              Về trang chủ
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BookingSuccessPage;