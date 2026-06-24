import React, { useState, useEffect } from "react";
import "./Booking.css";
import { createBooking } from "../../api/bookingService";
import SiteHeader from "./SiteHeader";
import { useNavigate } from "react-router-dom";
import { getActiveServices } from "../../api/servicePackageService";
import { getBranches } from "../../api/branchService";
import { getAvailableSlots } from "../../api/timeSlotService";
import { getMyVehicles } from "../../api/vehicleService";

// KHAI BÁO DỮ LIỆU MẪU RA NGOÀI COMPONENT ĐỂ TRÁNH LỖI REDECLARED IDENTIFIER
const DEFAULT_SERVICES = [
  {
    serviceId: 1,
    serviceName: "Gói Cơ Bản",
    basePrice: 350000,
    imageUrl: "https://images.unsplash.com/photo-1601362840469-51e4d8d59085?auto=format&fit=crop&w=400&q=80",
    features: ["Xà phòng pH trung tính", "Khăn Microfiber siêu thấm", "Làm khô khe kẽ bằng khí nén"],
    durationMinutes: 15,
    isPopular: false
  },
  {
    serviceId: 2,
    serviceName: "Gói Cao Cấp",
    basePrice: 750000,
    imageUrl: "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&w=400&q=80",
    features: ["Phủ bọt 3 lớp (Triple Foam)", "Dưỡng bóng lốp chuyên sâu", "Vệ sinh thảm lót chân"],
    durationMinutes: 30,
    isPopular: true
  },
  {
    serviceId: 3,
    serviceName: "Gói Kim Cương",
    basePrice: 1200000,
    imageUrl: "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=400&q=80",
    features: ["Wax Ceramic bảo vệ sơn", "Hút bụi & Vệ sinh nội thất", "Khử mùi diệt khuẩn chuyên sâu"],
    durationMinutes: 45,
    isPopular: false
  }
];

const MOCK_SLOTS_DATA = [
  { slotId: 101, startTime: "09:00 sáng", statusType: "ECO", statusLabel: "GIỜ ECO", available: true },
  { slotId: 102, startTime: "09:30 sáng", statusType: "NORMAL", statusLabel: "Còn 3 chỗ", available: true },
  { slotId: 103, startTime: "10:00 sáng", statusType: "NORMAL", statusLabel: "Còn 2 chỗ", available: true },
  { slotId: 104, startTime: "10:30 sáng", statusType: "PEAK", statusLabel: "GIỜ CAO ĐIỂM", available: true },
  { slotId: 105, startTime: "11:00 sáng", statusType: "NORMAL", statusLabel: "Còn 1 chỗ", available: true },
  { slotId: 106, startTime: "11:30 sáng", statusType: "FULL", statusLabel: "Hết chỗ", available: false },
];

export default function BookingPage() {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [branches, setBranches] = useState([]);
  const [slots, setSlots] = useState([]);
  const [vehicles, setVehicles] = useState([]);

  const [selectedBranch, setSelectedBranch] = useState(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [vehicleType, setVehicleType] = useState("4_seats"); 
  const [note, setNote] = useState("");
  
  const [selectedService, setSelectedService] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);

  const [licensePlate, setLicensePlate] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("online"); 
  const [agreeTerms, setAgreeTerms] = useState(false);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const monthNames = [
    "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
    "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
  ];

  useEffect(() => {
    loadServices();
    loadBranches();
    loadVehicles();
  }, []);

  const loadServices = async () => {
    try {
      const res = await getActiveServices();
      if (res.data && res.data.length > 0) {
        const merged = res.data.map((item, idx) => ({
          ...item,
          imageUrl: DEFAULT_SERVICES[idx]?.imageUrl || DEFAULT_SERVICES[0].imageUrl,
          features: DEFAULT_SERVICES[idx]?.features || DEFAULT_SERVICES[0].features,
          isPopular: idx === 1
        }));
        setServices(merged);
        setSelectedService(merged[0].serviceId);
      } else {
        setServices(DEFAULT_SERVICES);
        setSelectedService(DEFAULT_SERVICES[0].serviceId);
      }
    } catch (err) {
      setServices(DEFAULT_SERVICES);
      setSelectedService(DEFAULT_SERVICES[0].serviceId);
    }
  };

  const loadBranches = async () => {
    try {
      const res = await getBranches();
      if (res.data && res.data.length > 0) {
        setBranches(res.data);
        setSelectedBranch(res.data[0].branchId);
      }
    } catch (err) {
      console.log(err);
    }
  };

  const loadVehicles = async () => {
    try {
      const res = await getMyVehicles();
      if (res.data) setVehicles(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    // Bỏ dòng "if (!selectedBranch) return;" cũ đi
    loadSlots();
  }, [selectedBranch, selectedDate]);

  const loadSlots = async () => {
    // NẾU CHƯA CÓ CHI NHÁNH: Cứ lấy dữ liệu mẫu hiển thị giao diện trước đã
    if (!selectedBranch) {
      setSlots(MOCK_SLOTS_DATA);
      setSelectedTime(MOCK_SLOTS_DATA[2].slotId);
      return;
    }

    try {
      const date = selectedDate.toISOString().split("T")[0];
      const res = await getAvailableSlots(selectedBranch, date);
      if (res.data && res.data.length > 0) {
        const formattedSlots = res.data.map(slot => ({
          ...slot,
          statusType: slot.statusType || (slot.capacity <= 1 ? "PEAK" : "NORMAL"),
          statusLabel: slot.statusLabel || `Còn ${slot.capacity || 3} chỗ`,
          available: slot.available !== undefined ? slot.available : true
        }));
        setSlots(formattedSlots);
        setSelectedTime(formattedSlots[0].slotId);
      } else {
        setSlots(MOCK_SLOTS_DATA);
        setSelectedTime(MOCK_SLOTS_DATA[2].slotId);
      }
    } catch (err) {
      console.log("Lỗi API slots, chuyển sang dùng mock data:", err);
      setSlots(MOCK_SLOTS_DATA);
      setSelectedTime(MOCK_SLOTS_DATA[2].slotId);
    }
  };

  const selectedServiceData = services.find(s => s.serviceId === selectedService);
  const selectedSlotData = slots.find(s => s.slotId === selectedTime);

  const price = selectedServiceData ? selectedServiceData.basePrice : 0;
  const surcharge = vehicleType === "7_seats" ? 50000 : 0; 
  const subtotal = price + surcharge;
  const tax = Math.round(subtotal * 0.08);
  const discount = paymentMethod === "online" ? Math.round(subtotal * 0.05) : 0; 
  const total = subtotal + tax - discount;
  const rewardPoints = Math.floor(price / 10000); 

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const calendarDays = [];

  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i);
  }

  const handleBooking = async () => {
    if (!selectedService) {
      alert("Vui lòng chọn gói dịch vụ!");
      return;
    }
    if (!agreeTerms) {
      alert("Vui lòng xác nhận thông tin dịch vụ và điều khoản dịch vụ để tiếp tục!");
      return;
    }
    try {
      const bookingData = {
        customerId: 1,
        vehicleId: selectedVehicleId || null,
        vehicleType: vehicleType,
        licensePlate: licensePlate,
        slotId: selectedTime,
        branchId: selectedBranch,
        paymentMethod: paymentMethod,
        note,
        details: [{ serviceId: selectedService, quantity: 1 }]
      };

      await createBooking(bookingData);
      alert("Đặt lịch thành công!");
    } catch (error) {
      alert(error.response?.data?.message || "Đặt lịch thất bại");
    }
  };

  return (
    <div className="booking-page">
      <SiteHeader />
      
      <div className="booking-content-layout">
        <div className="booking-main-form">
          <div className="page-title-area">
            <h1>Đặt lịch rửa xe</h1>
            <p>Chọn dịch vụ, lên lịch thời gian và cung cấp thông tin xe của bạn.</p>
          </div>

          {/* 1. CHỌN DỊCH VỤ */}
          <section className="form-section-card">
            <div className="section-title-wrapper">
              <span className="section-icon">💧</span>
              <h3>1. Chọn dịch vụ</h3>
            </div>
            
            <div className="services-card-grid">
              {services.map(service => (
                <div
                  key={service.serviceId}
                  className={`service-item-card ${selectedService === service.serviceId ? "active-card" : ""} ${service.isPopular ? "popular-card" : ""}`}
                  onClick={() => setSelectedService(service.serviceId)}
                >
                  {service.isPopular && <span className="popular-badge">PHỔ BIẾN</span>}
                  <div className="service-img-holder">
                    <img src={service.imageUrl} alt={service.serviceName} />
                  </div>
                  <div className="service-details-box">
                    <div className="service-meta-header">
                      <h4>{service.serviceName}</h4>
                      <span className="service-price-label">{service.basePrice?.toLocaleString()}đ</span>
                    </div>
                    <p className="service-brief">{service.description}</p>
                    
                    <ul className="service-feature-checklist">
                      {(service.features || []).map((feature, idx) => (
                        <li key={idx}><span>✓</span> {feature}</li>
                      ))}
                    </ul>
                    
                    <div className="service-duration-info">
                      <span>⏱ {service.durationMinutes} phút</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 2. CHỌN THỜI GIAN */}
          <section className="form-section-card time-scheduler-section">
            <div className="section-title-wrapper">
              <span className="section-icon">📅</span>
              <h3>2. Chọn thời gian</h3>
            </div>
            
            <div className="scheduler-split-layout flex flex-col md:flex-row gap-gutter">
              {/* BÊN TRÁI: LỊCH CHỌN NGÀY */}
              <div className="calendar-card-widget flex-1 bg-surface rounded-lg border border-outline-variant/30 p-md">
                <div className="calendar-control-header flex justify-between items-center mb-md">
                  <button type="button" className="calendar-arrow-btn p-1 hover:bg-surface-container-low rounded" onClick={previousMonth}>❮</button>
                  <span className="calendar-month-title font-label-md text-label-md font-bold">Tháng {currentDate.getMonth() + 1}, {currentDate.getFullYear()}</span>
                  <button type="button" className="calendar-arrow-btn p-1 hover:bg-surface-container-low rounded" onClick={nextMonth}>❯</button>
                </div>

                <div className="calendar-weekdays-grid grid-cols-7 gap-1 text-center mb-2">
                  <div className="text-xs font-medium text-on-surface-variant">CN</div>
                  <div className="text-xs font-medium text-on-surface-variant">T2</div>
                  <div className="text-xs font-medium text-on-surface-variant">T3</div>
                  <div className="text-xs font-medium text-on-surface-variant">T4</div>
                  <div className="text-xs font-medium text-on-surface-variant">T5</div>
                  <div className="text-xs font-medium text-on-surface-variant">T6</div>
                  <div className="text-xs font-medium text-on-surface-variant">T7</div>
                </div>

                <div className="calendar-days-numeric-grid grid-cols-7 gap-1 text-center font-body-md">
                  {calendarDays.map((day, index) => {
                    const isSelected = day && 
                      selectedDate.getDate() === day &&
                      selectedDate.getMonth() === currentDate.getMonth() &&
                      selectedDate.getFullYear() === currentDate.getFullYear();
                    return (
                      <div
                        key={index}
                        className={`calendar-day-number-cell p-2 rounded cursor-pointer transition-colors ${day ? "clickable-day hover:bg-primary-container hover:text-on-primary-container" : "blank-day text-on-surface-variant opacity-50"} ${isSelected ? "day-selected-active bg-primary text-on-primary font-bold shadow-sm" : ""}`}
                        onClick={() => {
                          if (day) {
                            setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
                          }
                        }}
                      >
                        {day}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* BÊN PHẢI: KHUNG GIỜ TRỐNG CHUẨN ĐẸP TỰA STITCH */}
              <div className="time-slots-picker-widget flex-1 bg-surface rounded-lg border border-outline-variant/30 p-md flex flex-col h-full">
                <div className="slots-widget-header mb-md block">
                  <div className="flex justify-between items-center flex-wrap gap-2">
                    <h4 className="slots-widget-title font-label-md text-label-md font-bold text-on-surface">
                      Khung giờ trống - {selectedDate.getDate().toString().padStart(2, '0')} Th{selectedDate.getMonth() + 1}
                    </h4>
                    <div className="bay-live-status flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span className="text-[11px] text-gray-500">Bay 1 &amp; 2 đang sẵn sàng</span>
                    </div>
                  </div>
                </div>
                
                {/* Lưới chia đúng 2 cột (grid-cols-2) kèm gap chuẩn */}
                <div className="slots-grid-container grid grid-cols-2 gap-3 overflow-y-auto max-h-[240px] pr-2 custom-scrollbar">
                  {slots.map((slot) => {
                    const isSelected = selectedTime === slot.slotId;
                    const isDisabled = slot.available === false;
                    
                    const isEco = slot.statusType === "ECO";
                    const isPeak = slot.statusType === "PEAK";

                    // Cấu hình border và màu nền chuẩn chỉ cho từng trạng thái
                    let btnClass = "flex flex-col items-center justify-center border border-gray-200 rounded-lg py-3 px-2 transition-all relative min-h-[62px] bg-white hover:border-blue-600";
                    
                    if (isSelected) {
                      btnClass = "flex flex-col items-center justify-center border-2 border-blue-600 bg-blue-50/50 rounded-lg py-3 px-2 transition-all relative min-h-[62px]";
                    } else if (isDisabled) {
                      btnClass = "flex flex-col items-center justify-center border border-gray-100 bg-gray-50 rounded-lg py-3 px-2 opacity-40 cursor-not-allowed min-h-[62px]";
                    }

                    return (
                      <button
                        key={slot.slotId}
                        type="button"
                        disabled={isDisabled}
                        className={btnClass}
                        onClick={() => setSelectedTime(slot.slotId)}
                      >
                        {/* Giờ chính - Đặt block rõ ràng để ép xuống dòng */}
                        <span className={`block text-sm font-semibold tracking-wide ${isSelected ? "text-blue-600 font-bold" : "text-gray-800"}`}>
                          {slot.startTime}
                        </span>
                        
                        {/* Dòng subtext hiển thị trạng thái phía dưới */}
                        <span className={`block text-[11px] mt-0.5 font-medium ${
                          isSelected ? "text-blue-600/80 font-semibold" : 
                          isEco ? "text-emerald-600 font-bold" : 
                          isPeak ? "text-red-500 font-bold" : "text-gray-400"
                        }`}>
                          {isSelected ? "Đã chọn" : slot.statusLabel}
                        </span>

                        {/* Tag "Gợi ý" đặt tuyệt đối chuẩn xác ở góc trên bên phải */}
                        {isEco && !isSelected && !isDisabled && (
                          <span className="absolute -top-2 right-2 bg-emerald-50 text-emerald-600 text-[9px] font-bold px-1.5 py-0.5 rounded border border-emerald-200 shadow-sm non-selectable">
                            Gợi ý
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          {/* 3. THÔNG TIN XE */}
          <section className="form-section-card">
            <div className="section-title-wrapper">
              <span className="section-icon">🚗</span>
              <h3>3. Thông tin xe</h3>
            </div>
            
            <div className="vehicle-inputs-row">
              <div className="form-field-group">
                <label>Biển số xe *</label>
                <input
                  type="text"
                  placeholder="Ví dụ: 30A-123.45"
                  value={licensePlate}
                  onChange={(e) => setLicensePlate(e.target.value)}
                />
              </div>

              <div className="form-field-group">
                <label>Loại xe *</label>
                <div className="vehicle-type-segmented-control">
                  <button 
                    type="button"
                    className={`segment-btn ${vehicleType === "4_seats" ? "segment-active" : ""}`}
                    onClick={() => setVehicleType("4_seats")}
                  >
                    <span className="car-icon">🚗</span> Xe 4 chỗ
                  </button>
                  <button 
                    type="button"
                    className={`segment-btn ${vehicleType === "7_seats" ? "segment-active" : ""}`}
                    onClick={() => setVehicleType("7_seats")}
                  >
                    <span className="car-icon">🚙</span> Xe 7 chỗ
                  </button>
                </div>
              </div>
            </div>

            <div className="form-field-group full-width-field">
              <label>Yêu cầu đặc biệt (Không bắt buộc)</label>
              <textarea
                placeholder="Có khu vực nào cần lưu ý kỹ không?"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </section>
        </div>

        {/* BÊN PHẢI: SIDEBAR TÓM TẮT ĐƠN HÀNG */}
        <div className="booking-summary-sidebar">
          <div className="secure-checkout-badge">🛡 THANH TOÁN BẢO MẬT</div>
          
          <h3>Tóm tắt đơn hàng</h3>
          
          <div className="summary-billing-breakdown">
            <div className="billing-row prime-service">
              <span className="service-title">{selectedServiceData ? selectedServiceData.serviceName : "Chưa chọn gói"}</span>
              <span className="service-cost">{price.toLocaleString()}đ</span>
            </div>
            
            <div className="selected-datetime-preview">
              <p>📅 {selectedDate.getDate()} {monthNames[selectedDate.getMonth()]}, {selectedDate.getFullYear()} {selectedSlotData && ` • 🕒 ${selectedSlotData.startTime}`}</p>
            </div>

            <div className="billing-fees-list">
              <div className="fee-line">
                <span>Giá cơ bản</span>
                <span>{price.toLocaleString()}đ</span>
              </div>
              <div className="fee-line">
                <span>Phụ phí xe ({vehicleType === "4_seats" ? "4 chỗ" : "7 chỗ"})</span>
                <span>{surcharge > 0 ? `+${surcharge.toLocaleString()}đ` : "Miễn phí"}</span>
              </div>
              <div className="fee-line">
                <span>Thuế VAT (8%)</span>
                <span>{tax.toLocaleString()}đ</span>
              </div>
              {paymentMethod === "online" && (
                <div className="fee-line discount-line">
                  <span>Ưu đãi thanh toán online (5%)</span>
                  <span>-{discount.toLocaleString()}đ</span>
                </div>
              )}
              <div className="fee-line reward-points-line">
                <span>Điểm tích lũy nhận được</span>
                <span className="points-highlight">+{rewardPoints} điểm</span>
              </div>
            </div>
          </div>

          <hr className="divider" />
          
          <div className="grand-total-section">
            <span>Tổng cộng</span>
            <div className="total-amount-box">
              <span className="price-num">{total.toLocaleString()}đ</span>
              <small className="vat-inclusive-note">Đã bao gồm thuế & phí</small>
            </div>
          </div>

          <div className="payment-methods-selector">
            <h5>Phương thức thanh toán</h5>
            
            <label className={`method-option-card ${paymentMethod === "online" ? "method-active" : ""}`}>
              <input 
                type="radio" 
                name="payment" 
                value="online" 
                checked={paymentMethod === "online"}
                onChange={() => setPaymentMethod("online")}
              />
              <div className="method-label-content">
                <div className="method-text-main">Thanh toán trước (Online)</div>
                <small>Giảm thêm 5% tổng hóa đơn</small>
                <div className="gateway-logos">
                  <span className="badge-momo">MoMo</span>
                  <span className="badge-zalopay">ZaloPay</span>
                  <span className="badge-napas">NAPAS</span>
                </div>
              </div>
            </label>

            <label className={`method-option-card ${paymentMethod === "offline" ? "method-active" : ""}`}>
              <input 
                type="radio" 
                name="payment" 
                value="offline" 
                checked={paymentMethod === "offline"}
                onChange={() => setPaymentMethod("offline")}
              />
              <div className="method-label-content">
                <div className="method-text-main">Thanh toán sau (Tại trạm)</div>
                <small>Thanh toán khi hoàn tất dịch vụ</small>
              </div>
            </label>
          </div>

          <div className="terms-confirmation-checkbox">
            <label>
              <input 
                type="checkbox" 
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
              />
              <span>Tôi xác nhận các thông tin dịch vụ, thời gian và biển số xe đã cung cấp là chính xác.</span>
            </label>
          </div>

          <button className="execute-booking-btn" onClick={handleBooking}>
            Xác nhận đặt lịch <span className="btn-icon">✓</span>
          </button>
          
          <p className="legal-policy-notice">
            Bằng cách xác nhận, bạn đồng ý với <a href="#">Điều khoản Dịch vụ</a> của chúng tôi.
          </p>
        </div>
      </div>

      <footer className="booking-footer-bar">
        <div className="footer-brand-info">
          <h4>WashFlow Pro</h4>
          <p>© 2026 WashFlow Pro Automation. Tất cả quyền được bảo lưu.</p>
        </div>
        <div className="footer-nav-links">
          <a href="#">Liên hệ</a>
          <a href="#">Chính sách bảo mật</a>
          <a href="#">Điều khoản dịch vụ</a>
          <a href="#">Hỗ trợ</a>
        </div>
      </footer>
    </div>
  );
}