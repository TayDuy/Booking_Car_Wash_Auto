import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CheckCircle2, ListChecks, Home } from "lucide-react";
import bookingApi from "../../../api/bookingApi";
import "./BookingSuccessPage.css";

const fmtDate = (d) => d ? new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }) : "-";
const fmtTime = (t) => t ? new Date(`2000-01-01T${t}`).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : null;

function BookingSuccessPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { bookingId, bookingDetail: initialDetail } = location.state || {};

  const [bookingDetail, setBookingDetail] = useState(initialDetail || null);

  // Nếu thiếu dữ liệu (refresh trang), fetch full detail từ API
  useEffect(() => {
    if (bookingId && !bookingDetail) {
      bookingApi.get(bookingId).then(res => setBookingDetail(res.data)).catch(() => {});
    }
  }, [bookingId, bookingDetail]);

  const details = bookingDetail?.details || [];
  const firstService = details[0] || null;
  const serviceNames = details.map(d => d.serviceName).join(", ");
  const slotDate = bookingDetail?.slotDate;
  const slotStartTime = bookingDetail?.slotStartTime;
  const slotEndTime = bookingDetail?.slotEndTime;

  const timeRange = slotStartTime && slotEndTime
    ? `${fmtTime(slotStartTime)} - ${fmtTime(slotEndTime)}`
    : "-";

  const paymentMethod = bookingDetail?.paymentMethod;
  const isOnline = paymentMethod?.toLowerCase() === "online";

  return (
    <div className="pay-success-page">
      <div className="pay-success-inner">
        <div className="pay-success-icon">
          <CheckCircle2 size={44} strokeWidth={2} />
        </div>
        <h1>Đặt Lịch Thành Công!</h1>
        <p className="pay-success-subtitle">
          {isOnline
            ? "Cảm ơn bạn đã sử dụng dịch vụ của AutoWash Pro. Vui lòng tiến hành thanh toán để xác nhận lịch hẹn."
            : "Cảm ơn bạn đã sử dụng dịch vụ của AutoWash Pro. Vui lòng đến trạm đúng giờ và thanh toán khi hoàn tất dịch vụ."}
        </p>

        <div className="pay-success-layout">
          <div className="pay-success-card">
            <h3>Chi tiết đặt lịch</h3>
            <p className="pay-success-card-hint">Thông tin đặt lịch của bạn</p>

            <div className="pay-success-divider" />

            <div className="booking-summary-row">
              <div>
                <span>Booking ID</span>
                <strong>#{bookingId || "-"}</strong>
              </div>
              <div>
                <span>Dịch vụ</span>
                <strong>{serviceNames || firstService?.serviceName || "-"}</strong>
              </div>
            </div>
            <div className="booking-summary-row">
              <div>
                <span>Ngày</span>
                <strong>{slotDate ? fmtDate(slotDate) : "-"}</strong>
              </div>
              <div>
                <span>Giờ</span>
                <strong>{timeRange}</strong>
              </div>
            </div>
            <div className="booking-summary-row">
              <div>
                <span>Biển số xe</span>
                <strong>{bookingDetail?.licensePlate || "-"}</strong>
              </div>
              <div>
                <span>Thanh toán</span>
                <strong>{isOnline ? "Trực tuyến" : "Tại trạm"}</strong>
              </div>
            </div>
            {bookingDetail?.branchName && (
              <div className="booking-summary-row">
                <div>
                  <span>Chi nhánh</span>
                  <strong>{bookingDetail.branchName}</strong>
                </div>
                <div>
                  <span>Tổng tiền</span>
                  <strong>{((bookingDetail.finalAmount || bookingDetail.totalAmount) || 0).toLocaleString()}đ</strong>
                </div>
              </div>
            )}
          </div>

          <div className="pay-success-side">
            <div className="next-steps-card">
              <h3>Bước tiếp theo</h3>
              <p className="pay-success-card-hint">Bạn có thể làm gì tiếp theo</p>
              <div className="next-step">
                <span className="next-step-num">1</span>
                <div>
                  <strong>Đến trạm đúng giờ</strong>
                  <p>Hãy mang xe đến trung tâm đúng khung giờ đã đặt.</p>
                </div>
              </div>
              <div className="next-step">
                <span className="next-step-num">2</span>
                <div>
                  <strong>{bookingDetail?.paymentMethod?.toLowerCase() === "online" ? "Xác nhận thanh toán" : "Thanh toán tại trạm"}</strong>
                  <p>{bookingDetail?.paymentMethod?.toLowerCase() === "online" 
                      ? "Cổng thanh toán trực tuyến sẽ xác nhận giao dịch của bạn." 
                      : "Hoàn tất thanh toán sau khi dịch vụ kết thúc."}</p>
                </div>
              </div>
              <div className="next-step">
                <span className="next-step-num">3</span>
                <div>
                  <strong>Theo dõi trạng thái</strong>
                  <p>Xem lịch sử và tiến độ trong mục "Lịch sử".</p>
                </div>
              </div>
            </div>

            <button type="button" className="pay-success-btn primary" onClick={() => navigate("/customer/history")}>
              <ListChecks size={18} />
              Xem lịch sử đặt lịch
            </button>
            <button type="button" className="pay-success-btn secondary" onClick={() => navigate("/customer/home")}>
              <Home size={18} />
              Về trang chủ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BookingSuccessPage;
