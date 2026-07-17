import {
  CalendarDays,
  Car,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  PlusCircle,
  UserRound,
  Wrench,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import employeeApi from "../../../api/employeeApi";
import servicePackageApi from "../../../api/servicePackageApi";
import { getAvailableSlots } from "../../../api/timeSlotService";

import "./WalkInBookingPage.css";

const INITIAL_FORM = {
  guestName: "",
  guestPhone: "",
  guestEmail: "",
  licensePlate: "",
  brand: "",
  model: "",
  vehicleType: "4_seats",
  date: "",
  slotId: "",
  selectedServiceIds: [],
  paymentMethod: "offline",
  note: "",
};

function unwrapResponse(response) {
  return response?.data?.data ?? response?.data ?? response;
}

function unwrapList(response) {
  const responseData = unwrapResponse(response);

  if (Array.isArray(responseData)) {
    return responseData;
  }

  const possibleLists = [
    responseData?.content,
    responseData?.items,
    responseData?.slots,
    responseData?.services,
  ];

  return possibleLists.find(Array.isArray) || [];
}

function getErrorMessage(error) {
  const validationErrors = error?.response?.data?.errors;

  if (validationErrors && typeof validationErrors === "object") {
    return Object.values(validationErrors).join(", ");
  }

  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    "Không thể tạo booking. Vui lòng thử lại."
  );
}

function getTodayValue() {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatCurrency(value) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "0 ₫";
  }

  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatTime(value) {
  if (!value) {
    return "--:--";
  }

  return String(value).slice(0, 5);
}

function getServiceId(service) {
  return service?.serviceId ?? service?.id;
}

function getServiceName(service) {
  return service?.serviceName ?? service?.name ?? "Dịch vụ";
}

function getServicePrice(service) {
  return service?.basePrice ?? service?.price ?? 0;
}

function getServiceDuration(service) {
  return service?.durationMinutes ?? service?.duration ?? null;
}

function getCategory(service) {
  const name = (
    service?.serviceName ||
    service?.name ||
    ""
  ).toLowerCase();

  const description = (
    service?.description || ""
  ).toLowerCase();

  if (
    name.includes("add-on") ||
    name.includes("addon") ||
    name.includes("phụ trợ") ||
    name.includes("nước hoa")
  ) {
    return "addon";
  }

  if (
    name.includes("vip") ||
    name.includes("diamond") ||
    name.includes("kim cương") ||
    name.includes("combo")
  ) {
    return "vip";
  }

  if (
    name.includes("đánh bóng") ||
    name.includes("polish") ||
    name.includes("nano") ||
    name.includes("ceramic") ||
    description.includes("đánh bóng") ||
    description.includes("nano")
  ) {
    return "polish";
  }

  if (
    name.includes("nội thất") ||
    name.includes("interior") ||
    name.includes("hút bụi") ||
    description.includes("nội thất") ||
    description.includes("hút bụi")
  ) {
    return "interior";
  }

  return "wash";
}

function getSlotId(slot) {
  return slot?.slotId ?? slot?.id;
}

function getSlotStartTime(slot) {
  return slot?.startTime ?? slot?.slotStartTime;
}

function getSlotEndTime(slot) {
  return slot?.endTime ?? slot?.slotEndTime;
}

function getSlotBayName(slot) {
  return (
    slot?.bayName ||
    slot?.washBayName ||
    slot?.washBay?.bayName ||
    "Chưa xác định bay"
  );
}

function isSlotAvailable(slot) {
  return slot?.available !== false &&
    String(slot?.status ?? "available").toLowerCase() !== "unavailable";
}

function getEmployeeBranch(profile) {
  return {
    id: profile?.branchId ?? profile?.branch?.branchId ?? profile?.branch?.id,
    name: profile?.branchName ?? profile?.branch?.branchName ?? profile?.branch?.name,
    address: profile?.branchAddress ?? profile?.branch?.address,
  };
}

function isSlotInFuture(slot, selectedDate) {
  const startTime = getSlotStartTime(slot);

  if (!selectedDate || !startTime) {
    return true;
  }

  const slotDateTime = new Date(
    `${selectedDate}T${String(startTime).slice(0, 8)}`
  );

  if (Number.isNaN(slotDateTime.getTime())) {
    return true;
  }

  return slotDateTime.getTime() > Date.now();
}
const SERVICE_TABS = [
    { id: "all", label: "Tất cả" },
    { id: "wash", label: "Rửa xe" },
    { id: "interior", label: "Nội thất" },
    { id: "polish", label: "Đánh bóng" },
    { id: "vip", label: "Combo VIP" },
    { id: "addon", label: "Bổ sung" },
  ];

function WalkInBookingPage() {
  const navigate = useNavigate();

  const [activeServiceTab, setActiveServiceTab] =
    useState("all");

  const [form, setForm] = useState({
    ...INITIAL_FORM,
    date: getTodayValue(),
  });

  const [currentDate, setCurrentDate] = useState(new Date());
  const [agreeTerms, setAgreeTerms] = useState(false);

  const selectedDate = useMemo(() => {
    if (!form.date) {
      return new Date();
    }

    return new Date(`${form.date}T00:00:00`);
  }, [form.date]);

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const totalDaysInMonth = new Date(
      year,
      month + 1,
      0
    ).getDate();

    return [
      ...Array(firstDayOfMonth).fill(null),
      ...Array.from(
        { length: totalDaysInMonth },
        (_, index) => index + 1
      ),
    ];
  }, [currentDate]);

  const previousMonth = () => {
    setCurrentDate(
      (date) =>
        new Date(
          date.getFullYear(),
          date.getMonth() - 1,
          1
        )
    );
  };

  const nextMonth = () => {
    setCurrentDate(
      (date) =>
        new Date(
          date.getFullYear(),
          date.getMonth() + 1,
          1
        )
    );
  };

  const handleCalendarDaySelect = (day) => {
    if (!day) {
      return;
    }

    const selected = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      day
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selected < today) {
      return;
    }

    const year = selected.getFullYear();
    const month = String(selected.getMonth() + 1).padStart(
      2,
      "0"
    );
    const date = String(selected.getDate()).padStart(2, "0");

    setForm((currentForm) => ({
      ...currentForm,
      date: `${year}-${month}-${date}`,
      slotId: "",
    }));
  };

  const handleSlotSelect = (slotId) => {
    setForm((currentForm) => ({
      ...currentForm,
      slotId: String(slotId),
    }));
  };

  const [profile, setProfile] = useState(null);
  const [services, setServices] = useState([]);
  const [slots, setSlots] = useState([]);

  const employeeBranch = useMemo(
    () => getEmployeeBranch(profile),
    [profile]
  );

  const [initialLoading, setInitialLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [successBooking, setSuccessBooking] = useState(null);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setInitialLoading(true);
        setError("");

        const [profileResult, servicesResult] = await Promise.allSettled([
          employeeApi.getProfile(),
          servicePackageApi.active(),
        ]);

        const errors = [];

        if (profileResult.status === "fulfilled") {
          setProfile(unwrapResponse(profileResult.value) ?? null);
        } else {
          setProfile(null);
          errors.push(getErrorMessage(profileResult.reason));
        }

        if (servicesResult.status === "fulfilled") {
          setServices(unwrapList(servicesResult.value));
        } else {
          setServices([]);
          errors.push(getErrorMessage(servicesResult.reason));
        }

        setError([...new Set(errors)].join(" "));
      } catch (requestError) {
        setError(getErrorMessage(requestError));
      } finally {
        setInitialLoading(false);
      }
    };

    loadInitialData();
  }, []);

  useEffect(() => {
    const loadSlots = async () => {
      if (!employeeBranch.id || !form.date) {
        setSlots([]);
        return;
      }

      try {
        setSlotsLoading(true);
        setError("");

        const response = await getAvailableSlots(
          employeeBranch.id,
          form.date
        );

        const availableSlots = unwrapList(response).filter(
          (slot) =>
            isSlotAvailable(slot) &&
            isSlotInFuture(slot, form.date)
        );

        setSlots(availableSlots);

        setForm((currentForm) => {
          const selectedSlotStillExists = availableSlots.some(
            (slot) =>
              String(getSlotId(slot)) ===
              String(currentForm.slotId)
          );

          if (selectedSlotStillExists) {
            return currentForm;
          }

          return {
            ...currentForm,
            slotId: "",
          };
        });
      } catch (requestError) {
        setSlots([]);
        setError(getErrorMessage(requestError));
      } finally {
        setSlotsLoading(false);
      }
    };

    loadSlots();
  }, [employeeBranch.id, form.date]);

  const filteredServices = useMemo(() => {
    if (activeServiceTab === "all") {
      return services;
    }

    return services.filter(
      (service) =>
        getCategory(service) === activeServiceTab
    );
  }, [services, activeServiceTab]);

  const selectedServices = useMemo(() => {
    return services.filter((service) =>
      form.selectedServiceIds.includes(
        String(getServiceId(service))
      )
    );
  }, [form.selectedServiceIds, services]);

  const serviceAmount = useMemo(() => {
    return selectedServices.reduce(
      (total, service) =>
        total + Number(getServicePrice(service) || 0),
      0
    );
  }, [selectedServices]);

  // Đồng bộ Customer: xe 7 chỗ phụ thu 50.000 đồng
  const vehicleSurcharge =
    form.vehicleType === "7_seats" ? 50000 : 0;

  const subtotal = serviceAmount + vehicleSurcharge;

  // Đồng bộ Customer: VAT 8%
  const taxAmount = Math.round(subtotal * 0.08);

  const onlineDiscount =
    form.paymentMethod === "online"
      ? Math.round(subtotal * 0.05)
      : 0;

  const totalAmount = Math.max(
    0,
    subtotal + taxAmount - onlineDiscount
  );

  const selectedSlotData = slots.find(
    (slot) => String(getSlotId(slot)) === String(form.slotId)
  );

  const totalDuration = selectedServices.reduce(
    (total, service) =>
      total + Number(getServiceDuration(service) || 0),
    0
  );

  const DEPOSIT_THRESHOLD = 500000;
  const depositRequired = subtotal > DEPOSIT_THRESHOLD;

  useEffect(() => {
    if (depositRequired && form.paymentMethod !== "online") {
      setForm((currentForm) => ({
        ...currentForm,
        paymentMethod: "online",
      }));
    }
  }, [depositRequired, form.paymentMethod]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));

    setError("");
  };

  const handleServiceToggle = (serviceId) => {
    const normalizedId = String(serviceId);
    const selectedService = services.find(
      (service) => String(getServiceId(service)) === normalizedId
    );
    const isAddon = getCategory(selectedService) === "addon";

    setForm((currentForm) => {
      const exists =
        currentForm.selectedServiceIds.includes(normalizedId);

      if (exists) {
        return {
          ...currentForm,
          selectedServiceIds: currentForm.selectedServiceIds.filter(
            (id) => id !== normalizedId
          ),
        };
      }

      if (!isAddon) {
        const addonIds = currentForm.selectedServiceIds.filter((id) => {
          const service = services.find(
            (item) => String(getServiceId(item)) === id
          );

          return getCategory(service) === "addon";
        });

        return {
          ...currentForm,
          selectedServiceIds: [normalizedId, ...addonIds],
        };
      }

      return {
        ...currentForm,
        selectedServiceIds: [
          ...currentForm.selectedServiceIds,
          normalizedId,
        ],
      };
    });

    setError("");
  };

  const validateForm = () => {
    if (!employeeBranch.id) {
      return "Tài khoản Employee chưa được phân chi nhánh.";
    }

    if (!form.guestName.trim()) {
      return "Vui lòng nhập tên khách hàng.";
    }

    if (!form.guestPhone.trim()) {
      return "Vui lòng nhập số điện thoại khách hàng.";
    }

    if (!/^0\d{9}$/.test(form.guestPhone.trim())) {
      return "Số điện thoại phải gồm 10 chữ số và bắt đầu bằng 0.";
    }

    if (
      form.guestEmail.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        form.guestEmail.trim()
      )
    ) {
      return "Email khách hàng không hợp lệ.";
    }

    if (!form.licensePlate.trim()) {
      return "Vui lòng nhập biển số xe.";
    }

    if (!form.slotId) {
      return "Vui lòng chọn khung giờ.";
    }

    if (!selectedSlotData) {
      return "Khung giờ đã chọn không còn khả dụng. Vui lòng chọn lại.";
    }

    if (form.selectedServiceIds.length === 0) {
      return "Vui lòng chọn ít nhất một dịch vụ.";
    }

    const hasMainService = selectedServices.some(
      (service) => getCategory(service) !== "addon"
    );

    if (!hasMainService) {
      return "Vui lòng chọn một dịch vụ chính trước khi chọn dịch vụ bổ sung.";
    }

    if (!agreeTerms) {
      return "Vui lòng xác nhận thông tin booking.";
    }

    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationMessage = validateForm();

    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    const payload = {
      customerId: null,
      guestName: form.guestName.trim(),
      guestPhone: form.guestPhone.trim(),
      guestEmail: form.guestEmail.trim() || null,
      licensePlate: form.licensePlate
        .trim()
        .toUpperCase(),
      brand: form.brand.trim() || null,
      model: form.model.trim() || null,
      vehicleType: form.vehicleType,
      branchId: Number(employeeBranch.id),
      slotId: Number(form.slotId),
      details: form.selectedServiceIds.map((serviceId) => ({
        serviceId: Number(serviceId),
        quantity: 1,
      })),
      paymentMethod: form.paymentMethod,
      note: form.note.trim() || null,
    };

    try {
      setSubmitting(true);
      setError("");
      setSuccessBooking(null);

      const response =
        await employeeApi.createWalkInBooking(payload);

      const booking = unwrapResponse(response);

      const bookingId = booking?.bookingId ?? booking?.id;

      if (form.paymentMethod === "online") {
        if (!bookingId) {
          setSuccessBooking(booking);
          setError(
            "Booking đã được tạo nhưng chưa thể mở thanh toán vì backend không trả về bookingId. Vui lòng kiểm tra trong hàng đợi."
          );
          return;
        }

        navigate("/employee/payment", {
          state: {
            bookingId,
            bookingDetail: booking,
            source: "employee",
          },
        });
        return;
      }

      setSuccessBooking(booking);

      setForm({
        ...INITIAL_FORM,
        date: form.date,
      });
      setAgreeTerms(false);
      setActiveServiceTab("all");
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setSubmitting(false);
    }
  };

  if (initialLoading) {
    return (
      <section className="walk-in-booking-page">
        <div className="walk-in-booking-page__loading">
          <LoaderCircle
            size={38}
            className="is-spinning"
            aria-hidden="true"
          />

          <p>Đang tải dữ liệu tạo booking...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="walk-in-booking-page">
      <header className="walk-in-booking-page__header">
        <div>
          <p className="walk-in-booking-page__eyebrow">
            Booking tại quầy
          </p>

          <h1>Tạo booking cho khách</h1>

          <p>
            Nhập thông tin khách đến trực tiếp tại chi nhánh.
          </p>
        </div>

        <div className="walk-in-booking-page__branch">
          <span>Chi nhánh đang làm việc</span>

          <strong>
            {employeeBranch.name || "Chưa xác định"}
          </strong>

          <small>
            {employeeBranch.address || "Chưa có địa chỉ"}
          </small>
        </div>
      </header>

      {error && (
        <div className="walk-in-booking-page__error" role="alert">
          {error}
        </div>
      )}

      {successBooking && (
        <div
          className="walk-in-booking-page__success"
          role="status"
        >
          <CheckCircle2 size={24} aria-hidden="true" />

          <div>
            <strong>Tạo booking thành công</strong>

            <span>
              Mã booking:{" "}
              {successBooking.bookingCode ||
                `#${successBooking.bookingId}`}
            </span>
          </div>

          <button
            type="button"
            onClick={() => navigate("/employee/queue")}
          >
            Mở hàng đợi
          </button>
        </div>
      )}

      <form
        className="walk-in-booking-form"
        onSubmit={handleSubmit}
      >
      <div className="walk-in-booking-layout">
      <main className="walk-in-booking-main">
      {/* THÔNG TIN KHÁCH HÀNG VÀ XE */}
      <section className="walk-in-booking-form__section form-section-card" data-step="1">
        <div className="walk-in-booking-form__section-title section-title-wrapper">
          <Car size={21} className="section-icon" aria-hidden="true" />

          <div>
            <h2>Thông tin khách hàng và xe</h2>
            <p>Nhập thông tin khách vãng lai tại quầy.</p>
          </div>
        </div>

        {/* Họ tên và số điện thoại */}
        <div className="vehicle-inputs-row">
          <div className="form-field-group">
            <label htmlFor="guestName">
              Họ và tên <b>*</b>
            </label>

            <input
              id="guestName"
              type="text"
              name="guestName"
              value={form.guestName}
              onChange={handleChange}
              placeholder="Nguyễn Văn A"
              maxLength={100}
              required
            />
          </div>

          <div className="form-field-group">
            <label htmlFor="guestPhone">
              Số điện thoại <b>*</b>
            </label>

            <input
              id="guestPhone"
              type="tel"
              name="guestPhone"
              value={form.guestPhone}
              onChange={handleChange}
              placeholder="090 123 4567"
              maxLength={10}
              required
            />
          </div>
        </div>

        {/* Chi nhánh lấy từ Employee */}
        <div className="form-field-group full-width-field">
          <label htmlFor="employeeBranch">Chi nhánh *</label>

          <input
            id="employeeBranch"
            type="text"
            value={
              employeeBranch.name
                ? `${employeeBranch.name}${
                    employeeBranch.address
                      ? ` - ${employeeBranch.address}`
                      : ""
                  }`
                : "Chưa xác định chi nhánh"
            }
            disabled
          />

          <small className="employee-branch-hint">
            Booking được tạo tại chi nhánh Employee đang làm việc.
          </small>
        </div>

        {/* Biển số và loại xe */}
        <div className="vehicle-inputs-row">
          <div className="form-field-group">
            <label htmlFor="licensePlate">
              Biển số xe <b>*</b>
            </label>

            <input
              id="licensePlate"
              type="text"
              name="licensePlate"
              value={form.licensePlate}
              onChange={handleChange}
              placeholder="Ví dụ: 30A-123.45"
              maxLength={20}
              required
            />
          </div>

          <div className="form-field-group">
            <label>Loại xe *</label>

          <div className="vehicle-type-segmented-control">
            <button
              type="button"
              className={`segment-btn ${
                form.vehicleType === "4_seats"
                  ? "segment-active"
                  : ""
              }`}
              onClick={() =>
                setForm((currentForm) => ({
                  ...currentForm,
                  vehicleType: "4_seats",
                }))
              }
            >
              <Car size={18} className="car-icon" />
              Xe 4 chỗ
            </button>

            <button
              type="button"
              className={`segment-btn ${
                form.vehicleType === "7_seats"
                  ? "segment-active"
                  : ""
              }`}
              onClick={() =>
                setForm((currentForm) => ({
                  ...currentForm,
                  vehicleType: "7_seats",
                }))
              }
            >
              <Car size={18} className="car-icon" />
              Xe 7 chỗ
            </button>
          </div>

          <small className="vehicle-type-locked-hint">
            Xe 7 chỗ phụ thu thêm 50.000 ₫.
          </small>
          </div>
        </div>

        {/* Hãng xe và dòng xe */}
        <div className="vehicle-inputs-row">
          <div className="form-field-group">
            <label htmlFor="brand">Hãng xe</label>

            <input
              id="brand"
              type="text"
              name="brand"
              value={form.brand}
              onChange={handleChange}
              placeholder="Ví dụ: Toyota, Honda, Mazda..."
            />
          </div>

          <div className="form-field-group">
            <label htmlFor="model">Dòng xe</label>

            <input
              id="model"
              type="text"
              name="model"
              value={form.model}
              onChange={handleChange}
              placeholder="Ví dụ: Vios, City, CX-5..."
            />
          </div>
        </div>

        {/* Email */}
        <div className="form-field-group full-width-field">
          <label htmlFor="guestEmail">
            Email (không bắt buộc)
          </label>

          <input
            id="guestEmail"
            type="email"
            name="guestEmail"
            value={form.guestEmail}
            onChange={handleChange}
            placeholder="customer@example.com"
          />
        </div>
      </section>

      {/* CHỌN THỜI GIAN */}
      <section className="walk-in-booking-form__section form-section-card time-scheduler-section" data-step="2">
        <div className="walk-in-booking-form__section-title section-title-wrapper">
          <CalendarDays
            size={21}
            className="section-icon"
            aria-hidden="true"
          />

          <div>
            <h2>Chọn thời gian</h2>
            <p>
              Chọn ngày và khung giờ còn trống tại chi nhánh.
            </p>
          </div>
        </div>

        <div className="scheduler-split-layout">
          {/* LỊCH CHỌN NGÀY */}
          <div className="calendar-card-widget">
            <div className="calendar-control-header">
              <button
                type="button"
                className="calendar-arrow-btn"
                onClick={previousMonth}
                aria-label="Tháng trước"
              >
                ❮
              </button>

              <span className="calendar-month-title">
                Tháng {currentDate.getMonth() + 1},{" "}
                {currentDate.getFullYear()}
              </span>

              <button
                type="button"
                className="calendar-arrow-btn"
                onClick={nextMonth}
                aria-label="Tháng sau"
              >
                ❯
              </button>
            </div>

            <div className="calendar-weekdays-grid">
              {["CN", "T2", "T3", "T4", "T5", "T6", "T7"].map(
                (dayName) => (
                  <div key={dayName}>{dayName}</div>
                )
              )}
            </div>

            <div className="calendar-days-numeric-grid">
              {calendarDays.map((day, index) => {
                if (!day) {
                  return (
                    <div
                      key={`blank-${index}`}
                      className="calendar-day-number-cell blank-day"
                    />
                  );
                }

                const cellDate = new Date(
                  currentDate.getFullYear(),
                  currentDate.getMonth(),
                  day
                );

                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const isPastDay = cellDate < today;

                const isSelected =
                  selectedDate.getDate() === day &&
                  selectedDate.getMonth() ===
                    currentDate.getMonth() &&
                  selectedDate.getFullYear() ===
                    currentDate.getFullYear();

                let dayClassName =
                  "calendar-day-number-cell clickable-day";

                if (isPastDay) {
                  dayClassName += " past-day";
                }

                if (isSelected) {
                  dayClassName += " day-selected-active";
                }

                return (
                  <button
                    key={`day-${day}`}
                    type="button"
                    className={dayClassName}
                    disabled={isPastDay}
                    onClick={() =>
                      handleCalendarDaySelect(day)
                    }
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          {/* KHUNG GIỜ */}
          <div className="time-slots-picker-widget">
            <div className="slots-widget-header">
              <div>
                <h4 className="slots-widget-title">
                  Khung giờ trống -{" "}
                  {selectedDate
                    .getDate()
                    .toString()
                    .padStart(2, "0")}
                  /{selectedDate.getMonth() + 1}
                </h4>

                <div className="bay-live-status">
                  <span className="status-indicator-dot">●</span>

                  {slotsLoading
                    ? "Đang kiểm tra khung giờ..."
                    : slots.length > 0
                      ? `${slots.length} khung giờ đang sẵn sàng`
                      : "Chưa có khung giờ sẵn sàng"}
                </div>
              </div>
            </div>

            <div className="slots-grid-container">
              {slotsLoading ? (
                <div className="slots-empty-state">
                  <LoaderCircle
                    size={20}
                    className="is-spinning"
                    aria-hidden="true"
                  />

                  <span>Đang tải khung giờ...</span>
                </div>
              ) : slots.length === 0 ? (
                <div className="slots-empty-state">
                  Không có khung giờ còn trống trong ngày này.
                </div>
              ) : (
                slots.map((slot) => {
                  const slotId = getSlotId(slot);

                  const isSelected =
                    String(form.slotId) === String(slotId);

                  return (
                    <button
                      key={slotId}
                      type="button"
                      className={
                        isSelected
                          ? "time-slot-pill-btn pill-selected"
                          : "time-slot-pill-btn"
                      }
                      onClick={() =>
                        handleSlotSelect(slotId)
                      }
                    >
                      <span className="slot-clock-text">
                        {formatTime(getSlotStartTime(slot))}
                        {" - "}
                        {formatTime(getSlotEndTime(slot))}
                      </span>

                      <span className="slot-bay-name">
                        {getSlotBayName(slot)}
                      </span>

                      <span className="slot-status-subtext">
                        {isSelected ? "Đã chọn" : "Còn trống"}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </section>

        <section className="walk-in-booking-form__section form-section-card" data-step="3">
          <div className="walk-in-booking-form__section-title section-title-wrapper">
            <Wrench size={21} className="section-icon" aria-hidden="true" />

            <div>
              <h2>Chọn dịch vụ</h2>
              <p>Chọn một dịch vụ chính và các dịch vụ bổ sung nếu cần.</p>
            </div>
          </div>

          <div className="booking-service-tabs">
            {SERVICE_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={
                  activeServiceTab === tab.id
                    ? "booking-service-tab-btn active"
                    : "booking-service-tab-btn"
                }
                onClick={() => setActiveServiceTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {services.length === 0 ? (
            <p className="walk-in-booking-form__empty">
              Hiện chưa có dịch vụ đang hoạt động.
            </p>
          ) : filteredServices.length === 0 ? (
            <p className="walk-in-booking-form__empty">
              Không có dịch vụ trong nhóm này.
            </p>
          ) : (
            <div className="walk-in-service-grid">
              {filteredServices.map((service) => {
                const serviceId = getServiceId(service);
                const checked =
                  form.selectedServiceIds.includes(
                    String(serviceId)
                  );

                return (
                  <label
                    key={serviceId}
                    className={
                      checked
                        ? "walk-in-service-card is-selected"
                        : "walk-in-service-card"
                    }
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        handleServiceToggle(serviceId)
                      }
                    />

                    <div>
                      <strong>{getServiceName(service)}</strong>

                      {getServiceDuration(service) && (
                        <span>
                          <Clock3 size={14} aria-hidden="true" />
                          {getServiceDuration(service)} phút
                        </span>
                      )}

                      <b>
                        {formatCurrency(
                          getServicePrice(service)
                        )}
                      </b>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </section>

        <section className="walk-in-booking-form__section form-section-card" data-step="4">
          <div className="walk-in-booking-form__section-title section-title-wrapper">
            <PlusCircle size={21} className="section-icon" aria-hidden="true" />

            <div>
              <h2>Thông tin bổ sung</h2>
              <p>Thanh toán và ghi chú cho booking.</p>
            </div>
          </div>

          <div className="walk-in-booking-form__grid">
            <label className="walk-in-booking-form__full">
              <span>Ghi chú</span>

              <textarea
                name="note"
                value={form.note}
                onChange={handleChange}
                placeholder="Yêu cầu đặc biệt của khách..."
                rows={4}
              />
            </label>
          </div>
        </section>

        </main>

        <aside className="booking-summary-sidebar" aria-label="Tóm tắt booking">
          <div className="secure-checkout-badge">🛡 THANH TOÁN BẢO MẬT</div>
          <h3>Tóm tắt đơn hàng</h3>

          <div className="summary-billing-breakdown">
            {selectedServices.length > 0 ? (
              <div className="selected-service-summary-list">
                {selectedServices.map((service) => (
                  <div key={getServiceId(service)} className="billing-row prime-service">
                    <span className="service-title">{getServiceName(service)}</span>
                    <span className="service-cost">
                      {formatCurrency(getServicePrice(service))}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="billing-row prime-service">
                <span className="service-title">Chưa chọn dịch vụ</span>
              </div>
            )}

            <div className="selected-datetime-preview">
              <p>
                {selectedDate.toLocaleDateString("vi-VN")}
                {selectedSlotData &&
                  ` • ${formatTime(getSlotStartTime(selectedSlotData))}`}
              </p>
              {totalDuration > 0 && (
                <p>⏱ Tổng thời gian: khoảng {totalDuration} phút</p>
              )}
            </div>

            <div className="billing-fees-list">
              <div className="fee-line">
                <span>Giá dịch vụ</span>
                <span>{formatCurrency(serviceAmount)}</span>
              </div>
              <div className="fee-line">
                <span>
                  Phụ phí xe ({form.vehicleType === "7_seats" ? "7 chỗ" : "4 chỗ"})
                </span>
                <span>
                  {vehicleSurcharge > 0
                    ? `+${formatCurrency(vehicleSurcharge)}`
                    : "Miễn phí"}
                </span>
              </div>
              <div className="fee-line">
                <span>Thuế VAT (8%)</span>
                <span>{formatCurrency(taxAmount)}</span>
              </div>
              {onlineDiscount > 0 && (
                <div className="fee-line discount-line">
                  <span>Ưu đãi thanh toán online (5%)</span>
                  <span>-{formatCurrency(onlineDiscount)}</span>
                </div>
              )}
            </div>
          </div>

          <hr className="divider" />

          <div className="grand-total-section">
            <span>Tổng cộng</span>
            <div className="total-amount-box">
              <span className="price-num">{formatCurrency(totalAmount)}</span>
              <small className="vat-inclusive-note">Đã bao gồm thuế và phí</small>
            </div>
          </div>

          <div className="payment-methods-selector">
            <h5>Phương thức thanh toán</h5>

            {depositRequired && (
              <div className="deposit-notice">
                Đơn hàng trên {formatCurrency(DEPOSIT_THRESHOLD)} yêu cầu thanh toán online.
              </div>
            )}

            <label
              className={`method-option-card ${
                form.paymentMethod === "online" ? "method-active" : ""
              }`}
            >
              <input
                type="radio"
                name="paymentMethod"
                value="online"
                checked={form.paymentMethod === "online"}
                onChange={handleChange}
              />
              <div className="method-label-content">
                <div className="method-text-main">Thanh toán trước (Online)</div>
                <small>Giảm thêm 5% tạm tính</small>
                <div className="gateway-logos">
                  <span className="badge-vnpay">VNPAY</span>
                  <span className="badge-paypal">PayPal</span>
                </div>
              </div>
            </label>

            <label
              className={`method-option-card ${
                form.paymentMethod === "offline" ? "method-active" : ""
              } ${depositRequired ? "method-disabled" : ""}`}
            >
              <input
                type="radio"
                name="paymentMethod"
                value="offline"
                checked={form.paymentMethod === "offline"}
                disabled={depositRequired}
                onChange={handleChange}
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
                onChange={(event) => setAgreeTerms(event.target.checked)}
              />
              <span>
                Tôi xác nhận thông tin khách hàng, dịch vụ, thời gian và biển số xe là chính xác.
              </span>
            </label>
          </div>

          <button
            className="execute-booking-btn"
            type="submit"
            disabled={
              submitting ||
              slotsLoading ||
              services.length === 0 ||
              !agreeTerms
            }
          >
            {submitting ? (
              <>
                <LoaderCircle size={18} className="is-spinning" aria-hidden="true" />
                Đang tạo booking...
              </>
            ) : (
              <>
                Xác nhận đặt lịch <span className="btn-icon">✓</span>
              </>
            )}
          </button>

          <p className="legal-policy-notice">
            Bằng cách xác nhận, khách hàng đồng ý với điều khoản dịch vụ của AutoWash Pro.
          </p>
        </aside>
        </div>
      </form>
    </section>
  );
}

export default WalkInBookingPage;