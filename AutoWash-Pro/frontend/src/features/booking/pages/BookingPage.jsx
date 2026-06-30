import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./BookingPage.css";

const branches = [
  {
    id: 1,
    name: "WashFlow Kim Giang",
    address: "250 Kim Giang, Thanh Xuân, Hà Nội",
    distance: "0.8 km",
  },
  {
    id: 2,
    name: "WashFlow Nguyễn Trãi",
    address: "Nguyễn Trãi, Thanh Xuân, Hà Nội",
    distance: "2.4 km",
  },
  {
    id: 3,
    name: "WashFlow Cầu Giấy",
    address: "Cầu Giấy, Hà Nội",
    distance: "5.1 km",
  },
];

const services = [
  {
    id: 1,
    name: "Rửa xe cơ bản",
    description: "Rửa ngoại thất, làm sạch nhanh trong ngày.",
    duration: "30 phút",
    price: 80000,
    icon: "🚗",
  },
  {
    id: 2,
    name: "Rửa xe cao cấp",
    description: "Rửa ngoại thất, vệ sinh nội thất cơ bản.",
    duration: "60 phút",
    price: 180000,
    icon: "✨",
  },
  {
    id: 3,
    name: "Chăm sóc nội thất",
    description: "Vệ sinh ghế, sàn, taplo và khử mùi khoang xe.",
    duration: "90 phút",
    price: 250000,
    icon: "🧽",
  },
];

const timeSlots = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
];

function formatCurrency(value) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);
}

function BookingPage() {
  const navigate = useNavigate();

  const [selectedBranchId, setSelectedBranchId] = useState(1);
  const [selectedServiceId, setSelectedServiceId] = useState(1);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [note, setNote] = useState("");

  const selectedBranch = useMemo(() => {
    return branches.find((branch) => branch.id === selectedBranchId);
  }, [selectedBranchId]);

  const selectedService = useMemo(() => {
    return services.find((service) => service.id === selectedServiceId);
  }, [selectedServiceId]);

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!selectedDate) {
      alert("Vui lòng chọn ngày đặt lịch.");
      return;
    }

    if (!selectedTime) {
      alert("Vui lòng chọn khung giờ.");
      return;
    }

    const bookingDraft = {
      branch: selectedBranch,
      service: selectedService,
      date: selectedDate,
      time: selectedTime,
      note,
      totalAmount: selectedService.price,
    };

    localStorage.setItem("bookingDraft", JSON.stringify(bookingDraft));

    navigate("/customer/booking/success");
  };

  return (
    <div className="booking-page">
      <section className="booking-hero">
        <div className="app-container">
          <span className="booking-badge">Đặt lịch rửa xe</span>
          <h1>Chọn dịch vụ và thời gian phù hợp với bạn</h1>
          <p>
            Hoàn tất đặt lịch chỉ trong vài bước. Hệ thống sẽ giữ lịch cho bạn
            tại chi nhánh đã chọn.
          </p>
        </div>
      </section>

      <section className="booking-section">
        <div className="app-container booking-layout">
          <form className="booking-form" onSubmit={handleSubmit}>
            <div className="booking-step card">
              <div className="booking-step-header">
                <span>1</span>
                <div>
                  <h2>Chọn chi nhánh</h2>
                  <p>Chọn cơ sở rửa xe gần hoặc tiện nhất với bạn.</p>
                </div>
              </div>

              <div className="branch-list">
                {branches.map((branch) => (
                  <button
                    type="button"
                    className={
                      selectedBranchId === branch.id
                        ? "branch-card active"
                        : "branch-card"
                    }
                    key={branch.id}
                    onClick={() => setSelectedBranchId(branch.id)}
                  >
                    <div>
                      <h3>{branch.name}</h3>
                      <p>{branch.address}</p>
                    </div>

                    <span>{branch.distance}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="booking-step card">
              <div className="booking-step-header">
                <span>2</span>
                <div>
                  <h2>Chọn dịch vụ</h2>
                  <p>Chọn gói chăm sóc xe bạn muốn sử dụng.</p>
                </div>
              </div>

              <div className="service-option-list">
                {services.map((service) => (
                  <button
                    type="button"
                    className={
                      selectedServiceId === service.id
                        ? "service-option active"
                        : "service-option"
                    }
                    key={service.id}
                    onClick={() => setSelectedServiceId(service.id)}
                  >
                    <div className="service-option-icon">{service.icon}</div>

                    <div className="service-option-content">
                      <h3>{service.name}</h3>
                      <p>{service.description}</p>
                      <span>{service.duration}</span>
                    </div>

                    <strong>{formatCurrency(service.price)}</strong>
                  </button>
                ))}
              </div>
            </div>

            <div className="booking-step card">
              <div className="booking-step-header">
                <span>3</span>
                <div>
                  <h2>Chọn ngày và giờ</h2>
                  <p>Chọn thời gian bạn muốn mang xe đến chi nhánh.</p>
                </div>
              </div>

              <div className="booking-date-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="bookingDate">
                    Ngày đặt lịch
                  </label>
                  <input
                    id="bookingDate"
                    className="form-input"
                    type="date"
                    value={selectedDate}
                    onChange={(event) => setSelectedDate(event.target.value)}
                  />
                </div>
              </div>

              <div className="time-slot-list">
                {timeSlots.map((slot) => (
                  <button
                    type="button"
                    className={
                      selectedTime === slot ? "time-slot active" : "time-slot"
                    }
                    key={slot}
                    onClick={() => setSelectedTime(slot)}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>

            <div className="booking-step card">
              <div className="booking-step-header">
                <span>4</span>
                <div>
                  <h2>Ghi chú thêm</h2>
                  <p>Nhập yêu cầu đặc biệt nếu có.</p>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="note">
                  Ghi chú
                </label>
                <textarea
                  id="note"
                  className="form-textarea"
                  placeholder="Ví dụ: xe 7 chỗ, cần vệ sinh kỹ nội thất..."
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                />
              </div>
            </div>

            <button className="primary-button booking-mobile-submit" type="submit">
              Xác nhận đặt lịch
            </button>
          </form>

          <aside className="booking-summary card">
            <div className="booking-summary-header">
              <h2>Tóm tắt đặt lịch</h2>
              <p>Kiểm tra lại thông tin trước khi xác nhận.</p>
            </div>

            <div className="summary-list">
              <div className="summary-item">
                <span>Chi nhánh</span>
                <strong>{selectedBranch?.name}</strong>
              </div>

              <div className="summary-item">
                <span>Địa chỉ</span>
                <strong>{selectedBranch?.address}</strong>
              </div>

              <div className="summary-item">
                <span>Dịch vụ</span>
                <strong>{selectedService?.name}</strong>
              </div>

              <div className="summary-item">
                <span>Thời lượng</span>
                <strong>{selectedService?.duration}</strong>
              </div>

              <div className="summary-item">
                <span>Ngày</span>
                <strong>{selectedDate || "Chưa chọn"}</strong>
              </div>

              <div className="summary-item">
                <span>Giờ</span>
                <strong>{selectedTime || "Chưa chọn"}</strong>
              </div>
            </div>

            <div className="summary-total">
              <span>Tổng tiền</span>
              <strong>{formatCurrency(selectedService?.price || 0)}</strong>
            </div>

            <button className="primary-button booking-submit" onClick={handleSubmit}>
              Xác nhận đặt lịch
            </button>

            <p className="booking-summary-note">
              Bạn có thể thanh toán tại quầy hoặc theo phương thức được hỗ trợ
              sau khi booking được xác nhận.
            </p>
          </aside>
        </div>
      </section>
    </div>
  );
}

export default BookingPage;