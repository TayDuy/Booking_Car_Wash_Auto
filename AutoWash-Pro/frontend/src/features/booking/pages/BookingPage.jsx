import React, { useState, useEffect } from "react";
import "./BookingPage.css";
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
import bookingApi from "../../../api/bookingApi";
import customerApi from "../../../api/customerApi";
import vehicleApi from "../../../api/vehicleApi";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getActiveServices } from "../../../api/servicePackageService";
import { getBranches } from "../../../api/branchService";
import { getSlotsByBranchAndDate } from "../../../api/timeSlotService";
import promotionApi from "../../../api/promotionApi";
import { getMyRewards } from "../../../api/customerRewardApi";

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
  const [searchParams] = useSearchParams();


  const [services, setServices] = useState([]);
  const [branches, setBranches] = useState([]);
  const [slots, setSlots] = useState([]);
  const [slotsError, setSlotsError] = useState(null);

  const [selectedBranch, setSelectedBranch] = useState(null);
  const [vehicleType, setVehicleType] = useState("4_seats");
  const [note, setNote] = useState("");
  const [selectedPackageId, setSelectedPackageId] = useState(null);
  const [selectedAddonIds, setSelectedAddonIds] = useState([]);
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
  const [activeServiceTab, setActiveServiceTab] = useState("all");

  const monthNames = [
    "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
    "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
  ];

  const SERVICE_TABS = [
    { id: "all", label: "Tất cả" },
    { id: "wash", label: "Rửa xe" },
    { id: "interior", label: "Nội thất" },
    { id: "polish", label: "Đánh bóng" },
    { id: "vip", label: "Combo VIP" }
  ];

  const getCategory = (service) => {
    const name = (service.serviceName || service.name || "").toLowerCase();
    const desc = (service.description || "").toLowerCase();

    if (name.includes("add-on") || name.includes("addon") || name.includes("phụ trợ") || name.includes("nước hoa")) {
      return "addon";
    }
    if (name.includes("vip") || name.includes("diamond") || name.includes("kim cương") || name.includes("combo")) {
      return "vip";
    }
    if (name.includes("đánh bóng") || name.includes("polish") || name.includes("nano") || name.includes("ceramic") || desc.includes("đánh bóng") || desc.includes("nano")) {
      return "polish";
    }
    if (name.includes("nội thất") || name.includes("interior") || name.includes("hút bụi") || desc.includes("nội thất") || desc.includes("hút bụi")) {
      return "interior";
    }
    return "wash";
  };

  const mainPackages = React.useMemo(() => {
    return services.filter(s => getCategory(s) !== "addon");
  }, [services]);

  const addonServices = React.useMemo(() => {
    return services.filter(s => getCategory(s) === "addon");
  }, [services]);

  const filteredMainPackages = React.useMemo(() => {
    if (activeServiceTab === "all") return mainPackages;
    return mainPackages.filter(s => getCategory(s) === activeServiceTab);
  }, [mainPackages, activeServiceTab]);

  // Backend Vehicle.VehicleType: FOUR_SEATS(4 chỗ) / SEVEN_SEATS(7 chỗ)
  const mapVehicleTypeToUi = (backendType) => {
    if (backendType === "suv" || backendType === "truck") return "7_seats";
    return "4_seats";
  };

  // Format ngày theo giờ ĐỊA PHƯƠNG (yyyy-MM-dd), KHÔNG dùng toISOString().
  const formatDateLocal = (date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
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
        const servicesList = res.data?.data || res.data;
        const merged = servicesList?.length > 0
          ? servicesList.map(item => ({
              ...item,
              imageUrl: DEFAULT_SERVICES[0].imageUrl,
              isPopular: false
            }))
          : DEFAULT_SERVICES;
        setServices(merged);
        const preId = searchParams.get("serviceId");
        if (preId) {
          const targetSvc = merged.find(s => s.serviceId === Number(preId));
          if (targetSvc) {
            if (getCategory(targetSvc) === "addon") {
              setSelectedAddonIds([targetSvc.serviceId]);
            } else {
              setSelectedPackageId(targetSvc.serviceId);
              setActiveServiceTab(getCategory(targetSvc));
            }
          }
        }
      } catch (err) {
        setServices(DEFAULT_SERVICES);
      }
    };
    loadServices();

    const loadBranches = async () => {
      try {
        const res = await getBranches('active');
        const branchesList = res.data?.data || res.data;
        if (branchesList && branchesList.length > 0) {
          setBranches(branchesList);
          setSelectedBranch(branchesList[0].branchId);
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
        const res = await vehicleApi.listMyVehicles();
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
        const date = formatDateLocal(selectedDate);
        // FIX: trước đây gọi getAvailableSlots (BE chỉ trả status=open) → slot đã
        // FULL bị loại bỏ hoàn toàn khỏi response, khiến nó "biến mất" khỏi danh
        // sách thay vì hiển thị dạng xám/disable như UX thông thường (Grab, Booking.com...).
        // Giờ gọi getSlotsByBranchAndDate (lấy TẤT CẢ status) làm nguồn chính,
        // rồi tự lọc/đánh dấu available ở FE — vừa hiện được slot full (để khách
        // biết khung giờ đó tồn tại nhưng hết chỗ), vừa vẫn ẩn slot "closed"
        // (admin chủ động đóng, không nên cho khách thấy).
        const res = await getSlotsByBranchAndDate(selectedBranch, date);
        const rawSlots = res.data || [];
        const visibleSlots = rawSlots.filter(slot => slot.status !== "closed");

        if (visibleSlots.length > 0) {
          // ── GOM NHÓM SLOT THEO KHUNG GIỜ ──────────────────────────
          // Backend trả mỗi bay (Bay 1, 2, 3, 4) một slot riêng cho cùng startTime.
          // Khách không cần chọn bay — chỉ cần biết "08:00 còn bao nhiêu chỗ".
          // Ta gom tất cả slot cùng startTime → 1 nút duy nhất, cộng dồn remaining.
          const groupMap = new Map();
          visibleSlots.forEach(slot => {
            const key = slot.startTime;
            const max = slot.maxCapacity ?? 1;
            const current = slot.currentBookings ?? 0;
            const remaining = Math.max(max - current, 0);
            const isOpen = slot.status === "open" && remaining > 0;

            if (!groupMap.has(key)) {
              groupMap.set(key, {
                startTime: key,
                endTime: slot.endTime,
                totalRemaining: 0,
                totalMax: 0,
                bestSlotId: null,
                childSlots: [],
              });
            }
            const group = groupMap.get(key);
            group.totalRemaining += remaining;
            group.totalMax += max;
            group.childSlots.push({ slotId: slot.slotId, remaining, isOpen });
            if (isOpen && group.bestSlotId === null) {
              group.bestSlotId = slot.slotId;
            }
          });

          // Nếu ngày đang xem là hôm nay → lọc bỏ các khung giờ đã qua
          const now = new Date();
          const isToday = selectedDate.getFullYear() === now.getFullYear()
            && selectedDate.getMonth() === now.getMonth()
            && selectedDate.getDate() === now.getDate();
          const currentHHMM = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

          const formattedSlots = Array.from(groupMap.values()).map(g => {
            // Nếu hôm nay và startTime đã qua → đánh dấu hết chỗ
            const isPast = isToday && g.startTime.substring(0, 5) <= currentHHMM;
            const available = !isPast && g.totalRemaining > 0;
            let statusType = "NORMAL";
            if (!available) statusType = isPast ? "FULL" : (g.totalRemaining <= 0 ? "FULL" : (g.totalRemaining <= 2 ? "PEAK" : "NORMAL"));
            else if (g.totalRemaining <= 2) statusType = "PEAK";
            else if (g.totalRemaining >= g.totalMax * 0.7) statusType = "ECO";

            return {
              slotId: g.bestSlotId ?? g.childSlots[0]?.slotId,
              startTime: g.startTime,
              endTime: g.endTime,
              statusType,
              statusLabel: isPast ? "Đã qua" : (available ? `Còn ${g.totalRemaining} chỗ` : "Hết chỗ"),
              available,
            };
          }).sort((a, b) => a.startTime.localeCompare(b.startTime));

          setSlots(formattedSlots);
          const firstAvailable = formattedSlots.find(s => s.available);
          setSelectedTime(firstAvailable ? firstAvailable.slotId : null);
          setSlotsError(
              firstAvailable
                  ? null
                  : "Tất cả khung giờ trong ngày này đã kín chỗ. Vui lòng chọn ngày khác hoặc chi nhánh khác."
          );
        } else {
          // KHÔNG dùng MOCK_SLOTS_DATA nữa — slot giả có thể trùng ID với slot thật
          // đã hết hạn ngày trong DB, gây lỗi 500 khi đặt lịch (validate slotDate).
          setSlots([]);
          setSelectedTime(null);
          setSlotsError(
              rawSlots.length > 0
                  // Có slot nhưng toàn bộ đang "closed" (admin đóng thủ công)
                  ? "Chi nhánh tạm đóng lịch đặt cho ngày này. Vui lòng chọn ngày khác hoặc chi nhánh khác."
                  // Hoàn toàn chưa có slot nào — chưa generate lịch cho ngày này
                  : "Chi nhánh này chưa mở lịch đặt cho ngày đã chọn. Vui lòng chọn chi nhánh hoặc ngày khác."
          );
        }
      } catch (err) {
        setSlots([]);
        setSelectedTime(null);
        setSlotsError("Không tải được khung giờ trống. Vui lòng thử lại hoặc chọn ngày/chi nhánh khác.");
      }
    };
    loadSlots();
  }, [selectedBranch, selectedDate]);

  const selectedSlotData = slots.find(s => s.slotId === selectedTime);

  const selectedPackage = services.find(s => s.serviceId === selectedPackageId);
  const selectedAddons = services.filter(s => selectedAddonIds.includes(s.serviceId));
  const packagePrice = selectedPackage?.basePrice || 0;
  const addonsPrice = selectedAddons.reduce((sum, s) => sum + (s.basePrice || 0), 0);
  const surcharge = vehicleType === "7_seats" ? 50000 : 0;
  const subtotal = packagePrice + addonsPrice + surcharge;
  const tax = Math.round(subtotal * 0.08);
  const discount = paymentMethod === "online" ? Math.round(subtotal * 0.05) : 0;

  const total = Math.max(0, subtotal + tax - discount);
  const totalDuration = (selectedPackage?.durationMinutes || 0) + selectedAddons.reduce((sum, s) => sum + (s.durationMinutes || 0), 0);
  const rewardPoints = Math.floor(packagePrice / 10000);
  const DEPOSIT_THRESHOLD = 500000;
  const depositRequired = subtotal > DEPOSIT_THRESHOLD;





  const toggleAddon = (serviceId) => {
    setSelectedAddonIds(prev =>
      prev.includes(serviceId) ? prev.filter(id => id !== serviceId) : [...prev, serviceId]
    );
  };

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
    if (!selectedPackageId) { alert("Vui lòng chọn gói dịch vụ!"); return; }
    if (!agreeTerms) { alert("Vui lòng xác nhận thông tin dịch vụ và điều khoản dịch vụ để tiếp tục!"); return; }

    const customerIdRaw = localStorage.getItem("customerId");
    if (!customerIdRaw) { alert("Không tìm thấy thông tin khách hàng. Vui lòng đăng nhập lại!"); return; }
    if (!fullName.trim()) { alert("Vui lòng nhập họ và tên!"); return; }
    if (!phone.trim()) { alert("Vui lòng nhập số điện thoại!"); return; }
    if (!licensePlate.trim()) { alert("Vui lòng nhập biển số xe!"); return; }
    if (!brand.trim()) { alert("Vui lòng nhập hãng xe!"); return; }
    if (!selectedTime) { alert("Vui lòng chọn khung giờ!"); return; }
    if (!selectedBranch) { alert("Vui lòng chọn chi nhánh!"); return; }

    if (depositRequired) setPaymentMethod("online");

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
        paymentMethod: paymentMethod,
        details: [
          { serviceId: selectedPackageId, quantity: 1 },
          ...selectedAddonIds.map(id => ({ serviceId: id, quantity: 1 }))
        ]
      };
      const response = await bookingApi.create(bookingData);
      const result = response.data;
      const bookingId = result?.bookingId || result?.id || result?.data?.bookingId;
      if (paymentMethod === "offline" && !depositRequired) {
        navigate("/customer/booking/success", {
          state: { bookingId, bookingDetail: result }
        });
        return;
      }
      navigate("/customer/payment", {
        state: {
          bookingId
        },
      });
    } catch (error) {
      alert(error.response?.data?.message || "Đặt lịch thất bại. Vui lòng thử lại!");
    }
  };

  return (
      <div className="booking-page">
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
                <h3>1. Chọn dịch vụ chính</h3>
              </div>

              {/* Category Tabs for Main Packages */}
              <div className="booking-service-tabs">
                {SERVICE_TABS.map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    className={`booking-service-tab-btn ${activeServiceTab === tab.id ? "active" : ""}`}
                    onClick={() => setActiveServiceTab(tab.id)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="services-packages-row">
                {filteredMainPackages.length === 0 ? (
                  <div className="no-services-placeholder" style={{ gridColumn: 'span 3', textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                    Không có dịch vụ chính nào thuộc danh mục này.
                  </div>
                ) : (
                  filteredMainPackages.map(pkg => {
                    const selected = selectedPackageId === pkg.serviceId;
                    return (
                      <div
                        key={pkg.serviceId}
                        className={`package-card ${selected ? "package-selected" : ""} ${pkg.isPopular ? "package-popular" : ""}`}
                        onClick={() => setSelectedPackageId(pkg.serviceId)}
                        role="radio"
                        aria-checked={selected}
                        tabIndex={0}
                        onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelectedPackageId(pkg.serviceId); } }}
                      >
                        {pkg.isPopular && <span className="popular-badge">PHỔ BIẾN</span>}
                        <div className="package-body">
                          <div className="package-header">
                            <h4>{pkg.serviceName}</h4>
                            <span className="package-price">{pkg.basePrice?.toLocaleString()}đ</span>
                          </div>
                          <p className="package-duration">⏱ {pkg.durationMinutes} phút</p>
                          <p className="package-detail">{pkg.description || "Chi tiết gói dịch vụ"}</p>
                        </div>
                        <div className={`package-radio-indicator ${selected ? "radio-checked" : ""}`}>
                          {selected && <span className="radio-dot" />}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {addonServices.length > 0 && (
                <div className="addons-section">
                  <h4 className="addons-title">Dịch vụ bổ sung (Tùy chọn thêm)</h4>
                  <div className="addons-list">
                    {addonServices.map(addon => {
                      const checked = selectedAddonIds.includes(addon.serviceId);
                      return (
                        <label key={addon.serviceId} className={`addon-item ${checked ? "addon-checked" : ""}`}>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleAddon(addon.serviceId)}
                          />
                          <span className="addon-name">{addon.serviceName}</span>
                          <span className="addon-price">+{addon.basePrice?.toLocaleString()}đ</span>
                          <span className="addon-duration">{addon.durationMinutes}ph</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
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
                      // Chặn chọn ngày quá khứ
                      const todayMidnight = new Date();
                      todayMidnight.setHours(0, 0, 0, 0);
                      const cellDate = day ? new Date(currentDate.getFullYear(), currentDate.getMonth(), day) : null;
                      const isPastDay = cellDate && cellDate < todayMidnight;
                      return (
                          <div
                              key={day !== null ? `day-${day}` : `blank-${index}`}
                              className={`calendar-day-number-cell p-2 rounded transition-colors ${!day ? "blank-day text-on-surface-variant opacity-50" : isPastDay ? "past-day text-on-surface-variant opacity-30 cursor-not-allowed" : "clickable-day hover:bg-primary-container hover:text-on-primary-container cursor-pointer"} ${isSelected ? "day-selected-active bg-primary text-on-primary font-bold shadow-sm" : ""}`}
                              onClick={() => { if (day && !isPastDay) setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day)); }}
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
                        {(() => {
                          const readyBays = [...new Set(slots.filter(s => s.available).map(s => s.bayName).filter(Boolean))];
                          return readyBays.length > 0
                              ? `${readyBays.join(" & ")} đang sẵn sàng`
                              : "Chưa có bay nào sẵn sàng cho ngày này";
                        })()}
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
                                <span className="slot-clock-text">{(slot.startTime || "").replace(/:00$/, "")}</span>
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
                  {savedVehicles.length > 0 && (
                      <div className="saved-vehicle-chip-row">
                        {savedVehicles.map((v) => (
                            <button
                                key={v.vehicleId}
                                type="button"
                                className={`saved-vehicle-chip ${selectedVehicleId === v.vehicleId ? "saved-vehicle-chip-active" : ""}`}
                                onClick={() => applyVehicle(v)}
                            >
                              <MdDirectionsCar className="suggest-item-icon" />
                              {v.licensePlate}{v.nickname ? ` · ${v.nickname}` : v.brand ? ` · ${v.brand}` : ""}
                            </button>
                        ))}
                      </div>
                  )}
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
                        disabled={!!selectedVehicleId}
                    >
                      <MdDirectionsCar className="car-icon" /> Xe 4 chỗ
                    </button>
                    <button
                        type="button"
                        className={`segment-btn ${vehicleType === "7_seats" ? "segment-active" : ""}`}
                        onClick={() => setVehicleType("7_seats")}
                        disabled={!!selectedVehicleId}
                    >
                      <MdAirportShuttle className="car-icon" /> Xe 7 chỗ
                    </button>
                  </div>
                  {selectedVehicleId && (
                      <small className="vehicle-type-locked-hint" style={{ display: 'block', marginTop: '6px', fontSize: '11px', color: '#64748b' }}>
                        Loại xe và hãng xe theo hồ sơ xe đã lưu. Để đổi, vui lòng nhập biển số xe khác.
                      </small>
                  )}
                </div>
              </div>
              <div className="form-field-group full-width-field">
                <label>Hãng xe *</label>
                <input
                    type="text"
                    placeholder="Ví dụ: Toyota, Honda, Mazda..."
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    disabled={!!selectedVehicleId}
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
              {selectedPackageId ? (
                <>
                  <div className="billing-row prime-service">
                    <span className="service-title">{selectedPackage?.serviceName}</span>
                    <span className="service-cost">{packagePrice.toLocaleString()}đ</span>
                  </div>
                  {selectedAddons.length > 0 && (
                    <div className="addons-summary">
                      <span className="addons-summary-title">Dịch vụ thêm:</span>
                      {selectedAddons.map(a => (
                        <div key={a.serviceId} className="billing-row addon-row">
                          <span className="service-title">+ {a.serviceName}</span>
                          <span className="service-cost">{(a.basePrice || 0).toLocaleString()}đ</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="billing-row prime-service">
                  <span className="service-title">Chưa chọn dịch vụ</span>
                </div>
              )}
              <div className="selected-datetime-preview">
                <p>{selectedDate.getDate()} {monthNames[selectedDate.getMonth()]}, {selectedDate.getFullYear()}{selectedSlotData && ` • ${selectedSlotData.startTime}`}</p>
                {totalDuration > 0 && <p style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>⏱ Tổng thời gian: ~{totalDuration} phút</p>}
              </div>
              <div className="billing-fees-list">
                <div className="fee-line"><span>Giá dịch vụ</span><span>{(packagePrice + addonsPrice).toLocaleString()}đ</span></div>
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
              {depositRequired && (
                <div className="deposit-notice">
                  Đơn hàng trên {DEPOSIT_THRESHOLD.toLocaleString()}đ yêu cầu đặt cọc trước — vui lòng chọn thanh toán online.
                </div>
              )}
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
              <label className={`method-option-card ${paymentMethod === "offline" ? "method-active" : ""} ${depositRequired ? "method-disabled" : ""}`}>
                <input type="radio" name="payment" value="offline" checked={paymentMethod === "offline"} onChange={() => { if (!depositRequired) setPaymentMethod("offline"); }} disabled={depositRequired} />
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
      </div>
  );
}
