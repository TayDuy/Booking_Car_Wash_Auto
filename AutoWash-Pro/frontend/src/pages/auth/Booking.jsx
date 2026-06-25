import React, { useState, useEffect } from "react";
import "./Booking.css";
<<<<<<< HEAD
import {
  FaDroplet,
  FaCalendarDays,
  FaCarSide
} from "react-icons/fa6";
import {
  MdDirectionsCar,
  MdAirportShuttle
} from "react-icons/md";
import { createBooking } from "../../api/bookingService";
import SiteHeader from "./SiteHeader";
import { useNavigate } from "react-router-dom";
import { getActiveServices } from "../../api/servicePackageService";
import { getBranches } from "../../api/branchService";
import { getAvailableSlots } from "../../api/timeSlotService";
import vehicleApi from "../../api/vehicleApi";

// KHAI BÁO DỮ LIỆU MẪU RA NGOÀI COMPONENT ĐỂ TRÁNH LỖI REDECLARED IDENTIFIER
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

const MOCK_SLOTS_DATA = [
  { slotId: 101, startTime: "09:00 sáng", statusType: "ECO", statusLabel: "GIỜ ECO", available: true },
  { slotId: 102, startTime: "09:30 sáng", statusType: "NORMAL", statusLabel: "Còn 3 chỗ", available: true },
  { slotId: 103, startTime: "10:00 sáng", statusType: "NORMAL", statusLabel: "Còn 2 chỗ", available: true },
  { slotId: 104, startTime: "10:30 sáng", statusType: "PEAK", statusLabel: "GIỜ CAO ĐIỂM", available: true },
  { slotId: 105, startTime: "11:00 sáng", statusType: "NORMAL", statusLabel: "Còn 1 chỗ", available: true },
  { slotId: 106, startTime: "11:30 sáng", statusType: "FULL", statusLabel: "Hết chỗ", available: false },
  { slotId: 107, startTime: "12:00 sáng", available: true },
  { slotId: 108, startTime: "12:30 trưa", available: true },
];
=======
import axios from "axios";
import { createBooking } from "../../api/bookingService";
import { useNavigate } from "react-router-dom";
import { getUsername, getRole } from "../../api/authService";
>>>>>>> origin/develop

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
<<<<<<< HEAD
  
  const [selectedService, setSelectedService] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
=======
  const [selectedService, setSelectedService] = useState("Premium Shine");
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedSlotId, setSelectedSlotId] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
>>>>>>> origin/develop

  const [licensePlate, setLicensePlate] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("online"); 
  const [agreeTerms, setAgreeTerms] = useState(false);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const monthNames = [
<<<<<<< HEAD
    "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
    "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
  ];

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

    const loadVehicles = async () => {
    try {
      const response = await vehicleApi.list();

      const vehicles =
        response.data?.data ||
        response.data ||
        [];
      if (vehicles.length > 0) {
        setVehicles(vehicles);
      }
    } catch (err) {
      console.log(err);
    }
  };
    loadVehicles();
  }, []);

  useEffect(() => {
    // Bỏ dòng "if (!selectedBranch) return;" cũ đi
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
    loadSlots();
  }, [selectedBranch, selectedDate]);

  const handleVehicleChange = (vehicleId) => {
    setSelectedVehicleId(vehicleId);

    const selectedVehicle =
      vehicles.find(
        v => String(v.vehicleId) === String(vehicleId)
      );

    if(selectedVehicle){
      setLicensePlate(
        selectedVehicle.licensePlate || ""
      );

      setVehicleType(
        selectedVehicle.vehicleType || "4_seats"
      );
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
=======
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  useEffect(() => {
    const fetchSlots = async () => {
      try {
        const dateStr = selectedDate.toISOString().split("T")[0];
        const response = await axios.get(
            `/api/v1/time-slots/available?branchId=1&date=${dateStr}`
        );

        const data = response.data;
        console.log("Slots response:", data);

        if (Array.isArray(data)) {
          setAvailableSlots(data);
        } else if (data && Array.isArray(data.content)) {
          setAvailableSlots(data.content);
        } else if (data && Array.isArray(data.data)) {
          setAvailableSlots(data.data);
        } else {
          setAvailableSlots([]);
        }

        setSelectedSlotId(null);
        setSelectedTime("");
      } catch (error) {
        console.log(error);
        setAvailableSlots([]);
      }
    };

    fetchSlots();
  }, [selectedDate]);
>>>>>>> origin/develop

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
<<<<<<< HEAD
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
        customerId: localStorage.getItem("customerId"),
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
=======

  const calendarDays = [];
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let i = 1; i <= daysInMonth; i++) calendarDays.push(i);

  const services = [
    { name: "Basic Wash", price: "$15", duration: "~15 mins", description: "Exterior wash, foam bath, and spot-free rinse" },
    { name: "Premium Shine", price: "$30", duration: "~25 mins", description: "Basic + Triple foam, undercarriage wash, tire shine" },
    { name: "Ultimate Gold", price: "$50", duration: "~45 mins", description: "Premium + Ceramic wax, interior vacuum, wipe down" },
  ];

  const selectedServiceData = services.find((s) => s.name === selectedService);
  const price = Number(selectedServiceData.price.replace("$", ""));
  const tax = +(price * 0.08).toFixed(2);
  const total = +(price + tax).toFixed(2);

  const serviceMap = { "Basic Wash": 1, "Premium Shine": 2, "Ultimate Gold": 3 };

  const formatTime = (localTime) => {
    if (!localTime) return "";
    const [hourStr, minuteStr] = localTime.split(":");
    let hour = parseInt(hourStr);
    const minute = minuteStr;
    const period = hour >= 12 ? "PM" : "AM";
    if (hour > 12) hour -= 12;
    if (hour === 0) hour = 12;
    return `${String(hour).padStart(2, "0")}:${minute} ${period}`;
  };

  const handleBooking = async () => {
    if (!selectedSlotId) {
      alert("Vui lòng chọn khung giờ!");
      return;
    }

    try {
      const bookingData = {
        customerId: 1,
        vehicleId: 1,
        slotId: selectedSlotId,
        branchId: 1,
        note: note,
        details: [
          {
            serviceId: serviceMap[selectedService],
            quantity: 1,
          },
        ],
      };

      const response = await createBooking(bookingData);
      alert("Booking thành công!");
      console.log(response.data);
    } catch (error) {
      console.log(error);
      alert(error.response?.data?.message || "Booking thất bại");
>>>>>>> origin/develop
    }
  };

  return (
<<<<<<< HEAD
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
              {services.slice(0,3).map(service => (
                <div
                  key={service.serviceId}
                  className={`service-item-card ${selectedService === service.serviceId ? "active-card" : ""} ${service.isPopular ? "popular-card" : ""}`}
                  onClick={() => setSelectedService(service.serviceId)}
                >
                  {service.isPopular && <span className="popular-badge">PHỔ BIẾN</span>}
                  <div className="service-img-holder">
                    <img
                      src={
                        service.imageUrl ||
                        DEFAULT_SERVICES[0].imageUrl
                      }
                      alt={service.serviceName}
                    />
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
=======
      <div className="booking-page">

        {/* HEADER */}
        <header className="booking-header">
          <div className="logo">WashFlow Pro</div>
          <nav>
            <a href="#">Services</a>
            <a href="#" className="active">Booking</a>
            <a href="/loyalty">Loyalty</a>
          </nav>
          <div className="header-right">
            <div className="notification-wrapper">
              <button className="icon-btn" onClick={() => navigate("/notifications")}>🔔</button>
            </div>
            <button className="icon-btn" onClick={() => navigate("/support")}>❓</button>
            <div className="avatar" onClick={() => navigate("/profile")}>H</div>
          </div>
        </header>

        {showNotification && (
            <div className="notification-dropdown">
              <h4>Notifications</h4>
              <div className="notification-item">Appointment Reminder</div>
              <div className="notification-item">Summer Promotion</div>
              <div className="notification-item">Membership Updated</div>
>>>>>>> origin/develop
            </div>
        )}

<<<<<<< HEAD
          {/* 2. CHỌN THỜI GIAN */}
          <section className="form-section-card time-scheduler-section">
            <div className="section-title-wrapper">
              <FaCalendarDays className="section-icon" />
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
=======
        {showProfile && (
            <div className="profile-dropdown">
              <p>{getUsername()}</p>
              <p>{getRole()}</p>
              <button>Edit Profile</button>
              <button>Logout</button>
            </div>
        )}

        <div className="booking-content">

          {/* LEFT */}
          <div className="booking-left">
            <h1>Book a Wash</h1>
            <p>Select your service, schedule a time, and provide vehicle details.</p>

            {/* SERVICE */}
            <section className="booking-card">
              <h3>1. Select Service</h3>
              <div className="service-grid">
                {services.map((service) => (
                    <div
                        key={service.name}
                        className={`service-card ${selectedService === service.name ? "selected" : ""}`}
                        onClick={() => setSelectedService(service.name)}
                    >
                      <div className="service-top">
                        <h4>{service.name}</h4>
                        <span>{service.price}</span>
                      </div>
                      <p>{service.description}</p>
                      <small>{service.duration}</small>
                    </div>
                ))}
              </div>
            </section>

            {/* SCHEDULE */}
            <section className="booking-card">
              <h3>2. Schedule Time</h3>
              <div className="schedule-container">

                <div className="calendar-box">
                  <div className="calendar-header">
                    <button onClick={previousMonth}>❮</button>
                    <h4>{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h4>
                    <button onClick={nextMonth}>❯</button>
                  </div>
                  <div className="calendar-grid">
                    <div className="day-name">Su</div>
                    <div className="day-name">Mo</div>
                    <div className="day-name">Tu</div>
                    <div className="day-name">We</div>
                    <div className="day-name">Th</div>
                    <div className="day-name">Fr</div>
                    <div className="day-name">Sa</div>
                    {calendarDays.map((day, index) => (
                        <div
                            key={index}
                            className={`calendar-day ${
                                day &&
                                selectedDate.getDate() === day &&
                                selectedDate.getMonth() === currentDate.getMonth() &&
                                selectedDate.getFullYear() === currentDate.getFullYear()
                                    ? "selected-day" : ""
                            }`}
                            onClick={() => {
                              if (day) {
                                setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
                              }
                            }}
                        >
                          {day}
                        </div>
                    ))}
                  </div>
                </div>

                <div className="time-box">
                  <h4>
                    Available Slots —{" "}
                    {selectedDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </h4>
                  <div className="time-grid">
                    {availableSlots.length === 0 ? (
                        <p style={{ gridColumn: "span 2", color: "#888" }}>
                          Không có slot trống cho ngày này
                        </p>
                    ) : (
                        availableSlots.map((slot) => (
                            <button
                                key={slot.slotId}
                                className={selectedSlotId === slot.slotId ? "selected" : ""}
                                onClick={() => {
                                  setSelectedSlotId(slot.slotId);
                                  setSelectedTime(formatTime(slot.startTime));
                                }}
                            >
                              {formatTime(slot.startTime)}
                            </button>
                        ))
                    )}
                  </div>
                </div>

              </div>
            </section>

            {/* VEHICLE */}
            <section className="booking-card">
              <h3>3. Vehicle Information</h3>
              <div className="form-row">
                <div>
                  <label>License Plate *</label>
                  <input
                      placeholder="e.g. ABC-1234"
                      value={licensePlate}
                      onChange={(e) => setLicensePlate(e.target.value)}
                  />
                </div>
                <div>
                  <label>Vehicle Type *</label>
                  <select value={vehicleType} onChange={(e) => setVehicleType(e.target.value)}>
                    <option>Sedan</option>
                    <option>SUV</option>
                    <option>Truck</option>
                  </select>
>>>>>>> origin/develop
                </div>
              </div>
              <label>Special Instructions (Optional)</label>
              <textarea
                  placeholder="Any areas to focus on?"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
              />
            </section>
          </div>

<<<<<<< HEAD
              {/* BÊN PHẢI: KHUNG GIỜ TRỐNG CHUẨN ĐẸP TỰA STITCH */}
              <div className="time-slots-picker-widget flex-1 bg-surface rounded-lg border border-outline-variant/30 p-md flex flex-col h-full">
                <div className="slots-widget-header">
                  <div className="flex justify-between items-center flex-wrap gap-2">
                    <h4 className="slots-widget-title">
                      Khung giờ trống -{" "}
                      {selectedDate.getDate().toString().padStart(2, "0")} Th
                      {selectedDate.getMonth() + 1}
                    </h4>

                    <div className="bay-live-status">
                      <span className="status-indicator-dot">●</span>
                      Bay 1 & 2 đang sẵn sàng
                    </div>
                  </div>
                </div>
                
                {/* Lưới chia đúng 2 cột (grid-cols-2) kèm gap chuẩn */}
                <div className="slots-grid-container">
                  {slots.map((slot) => {
                    const isSelected = selectedTime === slot.slotId;
                    const isDisabled = slot.available === false;

                    const isEco = slot.statusType === "ECO";
                    const isPeak = slot.statusType === "PEAK";

                    let className = "time-slot-pill-btn";

                    if (isEco) className += " status-eco";
                    if (isPeak) className += " status-peak";
                    if (isSelected) className += " pill-selected";
                    return (
                      <button
                        key={slot.slotId}
                        type="button"
                        disabled={isDisabled}
                        className={className}
                        onClick={() => setSelectedTime(slot.slotId)}
                      >
                        <span className="slot-clock-text">
                          {slot.startTime}
                        </span>

                        <span className="slot-status-subtext">
                          {isSelected ? "Đã chọn" : slot.statusLabel}
                        </span>
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
              <FaCarSide className="section-icon" />
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
                    className={`segment-btn ${
                      vehicleType === "4_seats"
                        ? "segment-active"
                        : ""
                    }`}
                    onClick={() => setVehicleType("4_seats")}
                  >
                    <MdDirectionsCar className="car-icon" />
                    Xe 4 chỗ
                  </button>

                  <button
                    type="button"
                    className={`segment-btn ${
                      vehicleType === "7_seats"
                        ? "segment-active"
                        : ""
                    }`}
                    onClick={() => setVehicleType("7_seats")}
                  >
                    <MdAirportShuttle className="car-icon" />
                    Xe 7 chỗ
                  </button>
                </div>
              </div>
=======
          {/* RIGHT - SUMMARY */}
          <div className="booking-summary">
            <h3>Booking Summary</h3>
            <div className="summary-item">
              <span>{selectedServiceData.name}</span>
              <span>{selectedServiceData.price}</span>
            </div>
            <div className="summary-info">
              <p>
                {selectedDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                {selectedTime ? ` • ${selectedTime}` : ""}
              </p>
              <p>Est. Duration: {selectedServiceData.duration}</p>
              <p>Taxes & Fees: ${tax}</p>
>>>>>>> origin/develop
            </div>
            <hr />
            <div className="total">
              <span>Total</span>
              <span>${total}</span>
            </div>
            <button className="confirm-btn" onClick={handleBooking}>
              Confirm & Pay →
            </button>
          </div>

<<<<<<< HEAD
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
=======
        </div>

        {/* FOOTER */}
        <footer className="booking-footer">
          <div>
            <h3>WashFlow Pro</h3>
            <p>© 2024 WashFlow Pro Automation. All rights reserved.</p>
          </div>
          <div className="footer-links">
            <a href="#">Contact Us</a>
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Support</a>
>>>>>>> origin/develop
          </div>
        </footer>

<<<<<<< HEAD
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
=======
      </div>
>>>>>>> origin/develop
  );
}