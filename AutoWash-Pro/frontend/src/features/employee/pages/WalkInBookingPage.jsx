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
  vehicleType: "car",
  date: "",
  slotId: "",
  selectedServiceIds: [],
  paymentMethod: "offline",
  note: "",
};

function unwrapResponse(response) {
  return response?.data?.data ?? response?.data ?? response;
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

function WalkInBookingPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    ...INITIAL_FORM,
    date: getTodayValue(),
  });

  const [profile, setProfile] = useState(null);
  const [services, setServices] = useState([]);
  const [slots, setSlots] = useState([]);

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

        const [profileResponse, servicesResponse] = await Promise.all([
          employeeApi.getProfile(),
          servicePackageApi.active(),
        ]);

        const profileData = unwrapResponse(profileResponse);
        const servicesData = unwrapResponse(servicesResponse);

        setProfile(profileData ?? null);
        setServices(Array.isArray(servicesData) ? servicesData : []);
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
      if (!profile?.branchId || !form.date) {
        setSlots([]);
        return;
      }

      try {
        setSlotsLoading(true);
        setError("");

        const response = await getAvailableSlots(
          profile.branchId,
          form.date
        );

        const responseData = unwrapResponse(response);

        const availableSlots = Array.isArray(responseData)
          ? responseData.filter((slot) =>
              isSlotInFuture(slot, form.date)
            )
          : [];

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
  }, [profile?.branchId, form.date]);

  const selectedServices = useMemo(() => {
    return services.filter((service) =>
      form.selectedServiceIds.includes(
        String(getServiceId(service))
      )
    );
  }, [form.selectedServiceIds, services]);

  const totalAmount = useMemo(() => {
    return selectedServices.reduce(
      (total, service) =>
        total + Number(getServicePrice(service) || 0),
      0
    );
  }, [selectedServices]);

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

    setForm((currentForm) => {
      const exists =
        currentForm.selectedServiceIds.includes(normalizedId);

      return {
        ...currentForm,
        selectedServiceIds: exists
          ? currentForm.selectedServiceIds.filter(
              (id) => id !== normalizedId
            )
          : [
              ...currentForm.selectedServiceIds,
              normalizedId,
            ],
      };
    });

    setError("");
  };

  const validateForm = () => {
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

    if (form.selectedServiceIds.length === 0) {
      return "Vui lòng chọn ít nhất một dịch vụ.";
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

      setSuccessBooking(booking);

      setForm({
        ...INITIAL_FORM,
        date: form.date,
      });
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
            {profile?.branchName || "Chưa xác định"}
          </strong>

          <small>
            {profile?.branchAddress || "Chưa có địa chỉ"}
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
        <section className="walk-in-booking-form__section">
          <div className="walk-in-booking-form__section-title">
            <UserRound size={21} aria-hidden="true" />

            <div>
              <h2>Thông tin khách hàng</h2>
              <p>Thông tin liên hệ của khách tại quầy.</p>
            </div>
          </div>

          <div className="walk-in-booking-form__grid">
            <label>
              <span>
                Họ và tên <b>*</b>
              </span>

              <input
                type="text"
                name="guestName"
                value={form.guestName}
                onChange={handleChange}
                placeholder="Nguyễn Văn A"
                maxLength={100}
              />
            </label>

            <label>
              <span>
                Số điện thoại <b>*</b>
              </span>

              <input
                type="tel"
                name="guestPhone"
                value={form.guestPhone}
                onChange={handleChange}
                placeholder="0912345678"
                maxLength={10}
              />
            </label>

            <label className="walk-in-booking-form__full">
              <span>Email</span>

              <input
                type="email"
                name="guestEmail"
                value={form.guestEmail}
                onChange={handleChange}
                placeholder="customer@example.com"
              />
            </label>
          </div>
        </section>

        <section className="walk-in-booking-form__section">
          <div className="walk-in-booking-form__section-title">
            <Car size={21} aria-hidden="true" />

            <div>
              <h2>Thông tin xe</h2>
              <p>Thông tin phương tiện cần sử dụng dịch vụ.</p>
            </div>
          </div>

          <div className="walk-in-booking-form__grid">
            <label>
              <span>
                Biển số xe <b>*</b>
              </span>

              <input
                type="text"
                name="licensePlate"
                value={form.licensePlate}
                onChange={handleChange}
                placeholder="51A-12345"
                maxLength={20}
              />
            </label>

            <label>
              <span>Loại xe</span>

              <select
                name="vehicleType"
                value={form.vehicleType}
                onChange={handleChange}
              >
                <option value="car">Ô tô</option>
                <option value="motorcycle">Xe máy</option>
              </select>
            </label>

            <label>
              <span>Hãng xe</span>

              <input
                type="text"
                name="brand"
                value={form.brand}
                onChange={handleChange}
                placeholder="Toyota"
              />
            </label>

            <label>
              <span>Dòng xe</span>

              <input
                type="text"
                name="model"
                value={form.model}
                onChange={handleChange}
                placeholder="Vios"
              />
            </label>
          </div>
        </section>

        <section className="walk-in-booking-form__section">
          <div className="walk-in-booking-form__section-title">
            <CalendarDays size={21} aria-hidden="true" />

            <div>
              <h2>Ngày và khung giờ</h2>
              <p>
                Chỉ hiển thị các slot còn chỗ tại chi nhánh.
              </p>
            </div>
          </div>

          <div className="walk-in-booking-form__grid">
            <label>
              <span>
                Ngày phục vụ <b>*</b>
              </span>

              <input
                type="date"
                name="date"
                value={form.date}
                min={getTodayValue()}
                onChange={handleChange}
              />
            </label>

            <label>
              <span>
                Khung giờ <b>*</b>
              </span>

              <select
                name="slotId"
                value={form.slotId}
                onChange={handleChange}
                disabled={slotsLoading}
              >
                <option value="">
                  {slotsLoading
                    ? "Đang tải khung giờ..."
                    : "Chọn khung giờ"}
                </option>

                {slots.map((slot) => (
                  <option
                    key={getSlotId(slot)}
                    value={getSlotId(slot)}
                  >
                    {formatTime(getSlotStartTime(slot))}
                    {" - "}
                    {formatTime(getSlotEndTime(slot))}
                    {" · "}
                    {getSlotBayName(slot)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {!slotsLoading && slots.length === 0 && (
            <p className="walk-in-booking-form__empty">
              Không có khung giờ còn trống trong ngày đã chọn.
            </p>
          )}
        </section>

        <section className="walk-in-booking-form__section">
          <div className="walk-in-booking-form__section-title">
            <Wrench size={21} aria-hidden="true" />

            <div>
              <h2>Chọn dịch vụ</h2>
              <p>Có thể chọn một hoặc nhiều dịch vụ.</p>
            </div>
          </div>

          {services.length === 0 ? (
            <p className="walk-in-booking-form__empty">
              Hiện chưa có dịch vụ đang hoạt động.
            </p>
          ) : (
            <div className="walk-in-service-grid">
              {services.map((service) => {
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

        <section className="walk-in-booking-form__section">
          <div className="walk-in-booking-form__section-title">
            <PlusCircle size={21} aria-hidden="true" />

            <div>
              <h2>Thông tin bổ sung</h2>
              <p>Thanh toán và ghi chú cho booking.</p>
            </div>
          </div>

          <div className="walk-in-booking-form__grid">
            <label>
              <span>Phương thức thanh toán</span>

              <select
                name="paymentMethod"
                value={form.paymentMethod}
                onChange={handleChange}
              >
                <option value="offline">
                  Thanh toán tại quầy
                </option>
              </select>
            </label>

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

        <footer className="walk-in-booking-form__footer">
          <div>
            <span>Tổng tiền dự kiến</span>
            <strong>{formatCurrency(totalAmount)}</strong>
          </div>

          <button
            type="submit"
            disabled={
              submitting ||
              slotsLoading ||
              services.length === 0
            }
          >
            {submitting ? (
              <>
                <LoaderCircle
                  size={18}
                  className="is-spinning"
                  aria-hidden="true"
                />
                Đang tạo booking...
              </>
            ) : (
              <>
                <PlusCircle size={18} aria-hidden="true" />
                Tạo booking
              </>
            )}
          </button>
        </footer>
      </form>
    </section>
  );
}

export default WalkInBookingPage;