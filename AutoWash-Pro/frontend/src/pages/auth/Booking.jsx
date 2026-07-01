import React, { useState, useEffect } from "react";
import "./Booking.css";
import {
  FaDroplet,
  FaCalendarDays,
  FaCarSide
} from "react-icons/fa6";
import { FaPhoneAlt } from "react-icons/fa";
import {
  MdDirectionsCar,
  MdAirportShuttle
} from "react-icons/md";
import { createBooking } from "../../api/bookingService";
import customerApi from "../../api/customerApi";
import vehicleApi from "../../api/vehicleApi";
import SiteHeader from "./SiteHeader";
import { useNavigate } from "react-router-dom";
import { getActiveServices } from "../../api/servicePackageService";
import { getBranches } from "../../api/branchService";
import { getAvailableSlots } from "../../api/timeSlotService";

const DEFAULT_SERVICES = [
  {
    serviceId: 1,
    serviceName: "Gói Cơ Bản",
    basePrice: 350000,
    imageUrl: "https://lh3.googleusercontent.com/aida/AP1WRLu0paW8-vyihBC1QtGpIREgGftVGqLPfl_B4JHyp6P4DxmKPxPip6boYICgifRpwilvyJkne_UZf3hxCwNfkPn40CXMxMySo2H4v-asx9ailbq1kiRZ76gUF21AWrhAHQycrOXXx9eCS9KbV8EE18bMjqcbRD5914eCyESZsOJ24u5QxwmC1RBl0atGZkOQkc7aXQqvz8kd3JKslVuRXR1weGyyMWPyw9ZkGOW7d4kSIn7D--iiqLV7Rw-1",
    features: ["Xà phòng pH trung tính", "Khăn Microfiber siêu thấm", "Làm khô khe kẽ bằng khí nén"],
    durationMinutes: 15,
    isPopular: false
  },
  {
    serviceId: 2,
    serviceName: "Gói Cao Cấp",
    basePrice: 750000,
    imageUrl: "https://lh3.googleusercontent.com/aida/AP1WRLtsUQfoNHGvuu3_bYohhGOUlf19Bph-wu1Ool2o5TJ2KIby1rfNOE2SPm43MT6OuzVZSi0xDZ9dN0mTdQlt3jmruI217ptX3s3WMfFu8VvMXTqDrS0l2JBpjwfkhb98K0Lx1GFN2XzxfJPBFKf5mqmeE4ycJFrlHvMH-w2E7wH2GVo2yYnJD3oD7o64h9yf7Yuf1uswYAT41gFzoM5BP4_OlPOxKky-2cX4_4WYvelEePZ5n0tRGN1g1msF",
    features: ["Phủ bọt 3 lớp (Triple Foam)", "Dưỡng bóng lốp chuyên sâu", "Vệ sinh thảm lót chân"],
    durationMinutes: 30,
    isPopular: true
  },
  {
    serviceId: 3,
    serviceName: "Gói Kim Cương",
    basePrice: 1200000,
    imageUrl: "https://lh3.googleusercontent.com/aida/AP1WRLvi63JYKFsTVq5PCclrSGMPU633IBo-lrUgh1E6Xp2vqE9HYeiRjKz_yFA8oU9J-Fb9mgnHbJCMkmG8C-JvTN1ea6B64ru350hHw13-A1781Ok7-nj3neGtdvI3fxjJPhVt7e954SZyxGzNlBBSSFiKLR1ThfHYu8CRVUtkHxIt-GlMAx3UmmbfEven2UP6GLkaq8ZgVDDKqLXM-yDcbsDL4gb2AVRZHpjw72wgiThQWQvMyJhKC7VtlmQz",
    features: ["Wax Ceramic bảo vệ sơn", "Hút bụi & Vệ sinh nội thất", "Khử mùi diệt khuẩn chuyên sâu"],
    durationMinutes: 45,
    isPopular: false
  }
];

export default function BookingPage() {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [branches, setBranches] = useState([]);
  const [slots, setSlots] = useState([]);
  const [slotsError, setSlotsError] = useState(null);

  const [selectedBranch, setSelectedBranch] = useState(null);
  const [vehicleType, setVehicleType] = useState("4_seats");
  const [note, setNote] = useState("");
  const [selectedService, setSelectedService] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [licensePlate, setLicensePlate] = useState("");
  const [brand, setBrand] = useState("");
  const [savedVehicles, setSavedVehicles] = useState([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [profileData, setProfileData] = useState(null);
  const [phoneSuggestions, setPhoneSuggestions] = useState([]);
  const [showVehicleSuggest, setShowVehicleSuggest] = useState(false);
  const [showPhoneSuggest, setShowPhoneSuggest] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("online");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const monthNames = [
    "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
    "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
  ];

  // Backend lưu vehicleType là car/suv/truck, UI chỉ có 2 lựa chọn 4_seats/7_seats
  const mapVehicleTypeToUi = (backendType) => {
    if (backendType === "suv" || backendType === "truck") return "7_seats";
    return "4_seats";
  };

  const applyVehicle = (vehicle) => {
    if (!vehicle) return;
    setSelectedVehicleId(vehicle.vehicleId);
    setLicensePlate(vehicle.licensePlate || "");
    setBrand(vehicle.brand || "");
    setVehicleType(mapVehicleTypeToUi(vehicle.vehicleType));
    setShowVehicleSuggest(false);
  };

  useEffect(() => {
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
    loadServices();

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
    loadBranches();

    const loadProfile = async () => {
      try {
        const res = await customerApi.profile();
        if (res.data) {
          setProfileData(res.data);
          setFullName(res.data.fullName || "");
          setPhone(res.data.phone || "");
          if (res.data.phone) {
            setPhoneSuggestions((prev) => Array.from(new Set([...prev, res.data.phone])));
          }
        }
      } catch (err) {
        console.error("[Booking] Lỗi khi tải hồ sơ khách hàng:", err);
      }
    };
    loadProfile();

    // Gợi ý xe cũ: lấy danh sách xe đã lưu của khách hàng để autofill
    // biển số / hãng xe / loại xe, tránh phải nhập lại mỗi lần đặt lịch.
    const loadVehicles = async () => {
      try {
        const res = await vehicleApi.list();
        const list = res.data || [];
        if (list.length > 0) {
          setSavedVehicles(list);
          // Tự động điền theo xe gần nhất (phần tử đầu tiên trả về từ API)
          applyVehicle(list[0]);
        }
      } catch (err) {
        console.log(err);
      }
    };
    loadVehicles();
  }, []);

  useEffect(() => {
    const loadSlots = async () => {
      // Chưa xác định được chi nhánh (đang load chi nhánh) → chưa có gì để chọn.
      if (!selectedBranch) {
        setSlots([]);
        setSelectedTime(null);
        setSlotsError(null);
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
          setSlotsError(null);
        } else {
          // KHÔNG dùng MOCK_SLOTS_DATA nữa — slot giả có thể trùng ID với slot thật
          // đã hết hạn ngày trong DB, gây lỗi 500 khi đặt lịch (validate slotDate).
          setSlots([]);
          setSelectedTime(null);
          setSlotsError("Chi nhánh này chưa có khung giờ trống cho ngày đã chọn. Vui lòng chọn chi nhánh hoặc ngày khác.");
        }
      } catch (err) {
        setSlots([]);
        setSelectedTime(null);
        setSlotsError("Không tải được khung giờ trống. Vui lòng thử lại hoặc chọn ngày/chi nhánh khác.");
      }
    };
    loadSlots();
  }, [selectedBranch, selectedDate]);

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
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let i = 1; i <= daysInMonth; i++) calendarDays.push(i);

  const syncProfileIfChanged = async () => {
    const phoneChanged = phone.trim() !== (profileData?.phone || "");
    const nameChanged = fullName.trim() !== (profileData?.fullName || "");
    if (!phoneChanged && !nameChanged) return;

    try {
      await customerApi.updateProfile({
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: profileData?.email || "",
        dateOfBirth: profileData?.dateOfBirth || null,
        gender: profileData?.gender || null
      });
      setProfileData((prev) => ({ ...(prev || {}), fullName: fullName.trim(), phone: phone.trim() }));
    } catch (err) {
      console.error("[Booking] Lỗi khi lưu số điện thoại/họ tên vào hồ sơ:", err);
    }
  };

  const handleBooking = async () => {
    if (!selectedService) { alert("Vui lòng chọn gói dịch vụ!"); return; }
    if (!agreeTerms) { alert("Vui lòng xác nhận thông tin dịch vụ và điều khoản dịch vụ để tiếp tục!"); return; }

    const customerIdRaw = localStorage.getItem("customerId");
    if (!customerIdRaw) { alert("Không tìm thấy thông tin khách hàng. Vui lòng đăng nhập lại!"); return; }
    if (!fullName.trim()) { alert("Vui lòng nhập họ và tên!"); return; }
    if (!phone.trim()) { alert("Vui lòng nhập số điện thoại!"); return; }
    if (!licensePlate.trim()) { alert("Vui lòng nhập biển số xe!"); return; }
    if (!brand.trim()) { alert("Vui lòng nhập hãng xe!"); return; }
    if (!selectedTime) { alert("Vui lòng chọn khung giờ!"); return; }
    if (!selectedBranch) { alert("Vui lòng chọn chi nhánh!"); return; }

    try {
      await syncProfileIfChanged();

      const bookingData = {
        customerId: parseInt(customerIdRaw, 10),
        licensePlate: licensePlate.trim(),
        brand: brand.trim(),
        vehicleType: vehicleType,
        slotId: selectedTime,
        branchId: selectedBranch,
        note,
        details: [{ serviceId: selectedService, quantity: 1 }]
      };
      const result = await createBooking(bookingData);
      const bookingId = result?.data?.bookingId || result?.data?.id || result?.data?.data?.bookingId;
      navigate("/payment", { state: { bookingId } });
    } catch (error) {
      alert(error.response?.data?.message || "Đặt lịch thất bại. Vui lòng thử lại!");
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
                <FaDroplet className="section-icon" />
                <h3>1. Chọn dịch vụ</h3>
              </div>
              <div className="services-card-grid">
                {services.slice(0, 3).map(service => (
                    <div
                        key={service.serviceId}
                        className={`service-item-card ${selectedService === service.serviceId ? "active-card" : ""} ${service.isPopular ? "popular-card" : ""}`}
                        onClick={() => setSelectedService(service.serviceId)}
                    >
                      {service.isPopular && <span className="popular-badge">PHỔ BIẾN</span>}
                      <div className="service-img-holder">
                        <img src={service.imageUrl || DEFAULT_SERVICES[0].imageUrl} alt={service.serviceName} />
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
                <FaCalendarDays className="section-icon" />
                <h3>2. Chọn thời gian</h3>
              </div>
              <div className="scheduler-split-layout flex flex-col md:flex-row gap-gutter">
                <div className="calendar-card-widget flex-1 bg-surface rounded-lg border border-outline-variant/30 p-md">
                  <div className="calendar-control-header flex justify-between items-center mb-md">
                    <button type="button" className="calendar-arrow-btn p-1 hover:bg-surface-container-low rounded" onClick={previousMonth}>❮</button>
                    <span className="calendar-month-title font-label-md text-label-md font-bold">
                    Tháng {currentDate.getMonth() + 1}, {currentDate.getFullYear()}
                  </span>
                    <button type="button" className="calendar-arrow-btn p-1 hover:bg-surface-container-low rounded" onClick={nextMonth}>❯</button>
                  </div>
                  <div className="calendar-weekdays-grid grid-cols-7 gap-1 text-center mb-2">
                    {["CN","T2","T3","T4","T5","T6","T7"].map(d => (
                        <div key={d} className="text-xs font-medium text-on-surface-variant">{d}</div>
                    ))}
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
                              onClick={() => { if (day) setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day)); }}
                          >
                            {day}
                          </div>
                      );
                    })}
                  </div>
                </div>

                <div className="time-slots-picker-widget flex-1 bg-surface rounded-lg border border-outline-variant/30 p-md flex flex-col h-full">
                  <div className="slots-widget-header">
                    <div className="flex justify-between items-center flex-wrap gap-2">
                      <h4 className="slots-widget-title">
                        Khung giờ trống - {selectedDate.getDate().toString().padStart(2, "0")} Th{selectedDate.getMonth() + 1}
                      </h4>
                      <div className="bay-live-status">
                        <span className="status-indicator-dot">●</span>
                        Bay 1 & 2 đang sẵn sàng
                      </div>
                    </div>
                  </div>
                  <div className="slots-grid-container">
                    {slots.length === 0 ? (
                        <div className="slots-empty-state">
                          {slotsError || "Đang tải khung giờ..."}
                        </div>
                    ) : (
                        slots.map((slot) => {
                          const isSelected = selectedTime === slot.slotId;
                          const isDisabled = slot.available === false;
                          let className = "time-slot-pill-btn";
                          if (slot.statusType === "ECO") className += " status-eco";
                          if (slot.statusType === "PEAK") className += " status-peak";
                          if (isSelected) className += " pill-selected";
                          return (
                              <button key={slot.slotId} type="button" disabled={isDisabled} className={className} onClick={() => setSelectedTime(slot.slotId)}>
                                <span className="slot-clock-text">{slot.startTime}</span>
                                <span className="slot-status-subtext">{isSelected ? "Đã chọn" : slot.statusLabel}</span>
                              </button>
                          );
                        })
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* 3. THÔNG TIN XE */}
            <section className="form-section-card">
              <div className="section-title-wrapper">
                <FaCarSide className="section-icon" />
                <h3>3. Thông tin xe</h3>
              </div>
              <div className="vehicle-inputs-row">
                <div className="form-field-group">
                  <label>Họ và tên *</label>
                  <input
                      type="text"
                      placeholder="Nguyễn Văn A"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
                <div className="form-field-group">
                  <label>Số điện thoại *</label>
                  <div className="input-suggest-wrapper">
                    <input
                        type="text"
                        placeholder="090 123 4567"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        onFocus={() => setShowPhoneSuggest(true)}
                        onBlur={() => setTimeout(() => setShowPhoneSuggest(false), 150)}
                    />
                    {showPhoneSuggest && (
                        <div className="input-suggest-dropdown">
                          {phoneSuggestions.length > 0 ? (
                              <>
                                <div className="input-suggest-heading">Số điện thoại đã dùng</div>
                                {phoneSuggestions.map((p) => (
                                    <button
                                        key={p}
                                        type="button"
                                        className={`input-suggest-item ${phone === p ? "input-suggest-item-active" : ""}`}
                                        onMouseDown={() => { setPhone(p); setShowPhoneSuggest(false); }}
                                    >
                                      <FaPhoneAlt className="suggest-item-icon" />
                                      <span>{p}</span>
                                    </button>
                                ))}
                              </>
                          ) : (
                              <div className="input-suggest-empty">Chưa có số điện thoại nào được lưu trong hồ sơ</div>
                          )}
                        </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="form-field-group full-width-field">
                <label>Chi nhánh *</label>
                <select
                    value={selectedBranch || ""}
                    onChange={(e) => setSelectedBranch(Number(e.target.value))}
                >
                  {branches.length === 0 && <option value="">Đang tải chi nhánh...</option>}
                  {branches.map((b) => (
                      <option key={b.branchId} value={b.branchId}>
                        {b.branchName}{b.address ? ` - ${b.address}` : ""}
                      </option>
                  ))}
                </select>
              </div>
              <div className="vehicle-inputs-row">
                <div className="form-field-group">
                  <label>Biển số xe *</label>
                  <div className="input-suggest-wrapper">
                    <input
                        type="text"
                        placeholder="Ví dụ: 30A-123.45"
                        value={licensePlate}
                        onChange={(e) => { setLicensePlate(e.target.value); setSelectedVehicleId(null); }}
                        onFocus={() => setShowVehicleSuggest(true)}
                        onBlur={() => setTimeout(() => setShowVehicleSuggest(false), 150)}
                    />
                    {showVehicleSuggest && savedVehicles.length > 0 && (
                        <div className="input-suggest-dropdown">
                          <div className="input-suggest-heading">Xe đã lưu (chọn để điền nhanh)</div>
                          {savedVehicles.map((v) => (
                              <button
                                  key={v.vehicleId}
                                  type="button"
                                  className={`input-suggest-item ${selectedVehicleId === v.vehicleId ? "input-suggest-item-active" : ""}`}
                                  onMouseDown={() => applyVehicle(v)}
                              >
                                <MdDirectionsCar className="suggest-item-icon" />
                                <span>{v.nickname || v.brand}</span>
                                <span className="suggest-item-tag">{v.licensePlate}</span>
                              </button>
                          ))}
                        </div>
                    )}
                  </div>
                </div>
                <div className="form-field-group">
                  <label>Loại xe *</label>
                  <div className="vehicle-type-segmented-control">
                    <button
                        type="button"
                        className={`segment-btn ${vehicleType === "4_seats" ? "segment-active" : ""}`}
                        onClick={() => setVehicleType("4_seats")}
                    >
                      <MdDirectionsCar className="car-icon" /> Xe 4 chỗ
                    </button>
                    <button
                        type="button"
                        className={`segment-btn ${vehicleType === "7_seats" ? "segment-active" : ""}`}
                        onClick={() => setVehicleType("7_seats")}
                    >
                      <MdAirportShuttle className="car-icon" /> Xe 7 chỗ
                    </button>
                  </div>
                </div>
              </div>
              <div className="form-field-group full-width-field">
                <label>Hãng xe *</label>
                <input
                    type="text"
                    placeholder="Ví dụ: Toyota, Honda, Mazda..."
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                />
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

          {/* SIDEBAR */}
          <div className="booking-summary-sidebar">
            <div className="secure-checkout-badge">🛡 THANH TOÁN BẢO MẬT</div>
            <h3>Tóm tắt đơn hàng</h3>
            <div className="summary-billing-breakdown">
              <div className="billing-row prime-service">
                <span className="service-title">{selectedServiceData ? selectedServiceData.serviceName : "Chưa chọn gói"}</span>
                <span className="service-cost">{price.toLocaleString()}đ</span>
              </div>
              <div className="selected-datetime-preview">
                <p>{selectedDate.getDate()} {monthNames[selectedDate.getMonth()]}, {selectedDate.getFullYear()}{selectedSlotData && ` • ${selectedSlotData.startTime}`}</p>
              </div>
              <div className="billing-fees-list">
                <div className="fee-line"><span>Giá cơ bản</span><span>{price.toLocaleString()}đ</span></div>
                <div className="fee-line">
                  <span>Phụ phí xe ({vehicleType === "4_seats" ? "4 chỗ" : "7 chỗ"})</span>
                  <span>{surcharge > 0 ? `+${surcharge.toLocaleString()}đ` : "Miễn phí"}</span>
                </div>
                <div className="fee-line"><span>Thuế VAT (8%)</span><span>{tax.toLocaleString()}đ</span></div>
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
                <input type="radio" name="payment" value="online" checked={paymentMethod === "online"} onChange={() => setPaymentMethod("online")} />
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
                <input type="radio" name="payment" value="offline" checked={paymentMethod === "offline"} onChange={() => setPaymentMethod("offline")} />
                <div className="method-label-content">
                  <div className="method-text-main">Thanh toán sau (Tại trạm)</div>
                  <small>Thanh toán khi hoàn tất dịch vụ</small>
                </div>
              </label>
            </div>
            <div className="terms-confirmation-checkbox">
              <label>
                <input type="checkbox" checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)} />
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

        <footer className="global-footer-bar">
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