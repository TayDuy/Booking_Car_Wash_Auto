import { useEffect, useState } from "react";
import { Save, RotateCcw } from "lucide-react";
import systemSettingApi from "../../../api/systemSettingApi";
import "./SystemSettingsPage.css";

const defaultSettings = {
  shopName: "WashFlow Pro",
  hotline: "1900 1080",
  email: "admin@washflow.vn",
  website: "https://washflow.vn",
  address: "TP.HCM, Việt Nam",

  openTime: "08:00",
  closeTime: "20:00",
  vat: 8,

  maxBookingDays: 30,
  cancelBeforeHours: 24,
  maxVehiclePerSlot: 6,

  silverBookings: 10,
  goldBookings: 30,
  vipBookings: 60,

  emailNotification: true,
  smsNotification: false,
  pushNotification: true,
};

export default function SystemSettingsPage() {
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    setLoading(true);

    try {
      const response = await systemSettingApi.get();
      const data = response.data?.data || response.data;

      setSettings({
        ...defaultSettings,
        ...data,
      });
    } catch (error) {
      console.error("Load settings failed:", error);
      alert(
        error.response?.data?.message ||
        "Không tải được cấu hình hệ thống."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target;

    const numberFields = [
      "vat",
      "maxBookingDays",
      "cancelBeforeHours",
      "maxVehiclePerSlot",
      "silverBookings",
      "goldBookings",
      "vipBookings",
    ];

    setSettings((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : numberFields.includes(name)
            ? Number(value)
            : value,
    }));
  }

  async function handleSave() {
    try {
      const response = await systemSettingApi.update(settings);
      const data = response.data?.data || response.data;

      setSettings({
        ...defaultSettings,
        ...data,
      });

      alert("Lưu cấu hình thành công.");
    } catch (error) {
      console.error("Save settings failed:", error);
      alert(
        error.response?.data?.message ||
        "Lưu cấu hình thất bại."
      );
    }
  }

  async function handleReset() {
    const ok = window.confirm(
      "Bạn có chắc muốn khôi phục cấu hình mặc định?"
    );

    if (!ok) return;

    try {
      const response = await systemSettingApi.reset();
      const data = response.data?.data || response.data;

      setSettings({
        ...defaultSettings,
        ...data,
      });

      alert("Đã khôi phục cấu hình mặc định.");
    } catch (error) {
      console.error("Reset settings failed:", error);
      alert(
        error.response?.data?.message ||
        "Khôi phục cấu hình thất bại."
      );
    }
  }

  if (loading) {
    return (
      <div className="settings-page">
        <div className="settings-card">
          <h2>Đang tải cấu hình...</h2>
        </div>
      </div>
    );
  }
  return (
    <div className="settings-page">
      <div className="manage-header">
        <div>
          <h1>Cấu hình hệ thống</h1>
          <p>Thiết lập thông tin vận hành cho WashFlow Pro.</p>
        </div>

        <div className="settings-actions">
          <button className="reset-btn" onClick={handleReset}>
            <RotateCcw size={18} />
            Khôi phục
          </button>

          <button className="refresh-btn" onClick={handleSave}>
            <Save size={18} />
            Lưu cấu hình
          </button>
        </div>
      </div>

      <div className="settings-grid">
        <div className="settings-card">
          <h2>Thông tin cửa hàng</h2>

          <div className="settings-form">
            <div className="form-group">
              <label>Tên cửa hàng</label>
              <input name="shopName" value={settings.shopName} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label>Hotline</label>
              <input name="hotline" value={settings.hotline} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input name="email" value={settings.email} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label>Website</label>
              <input name="website" value={settings.website} onChange={handleChange} />
            </div>

            <div className="form-group full">
              <label>Địa chỉ</label>
              <input name="address" value={settings.address} onChange={handleChange} />
            </div>
          </div>
        </div>

        <div className="settings-card">
          <h2>Giờ làm việc & VAT</h2>

          <div className="settings-form">
            <div className="form-group">
              <label>Giờ mở cửa</label>
              <input type="time" name="openTime" value={settings.openTime} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label>Giờ đóng cửa</label>
              <input type="time" name="closeTime" value={settings.closeTime} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label>VAT (%)</label>
              <input type="number" name="vat" value={settings.vat} onChange={handleChange} />
            </div>
          </div>
        </div>

        <div className="settings-card">
          <h2>Cấu hình đặt lịch</h2>

          <div className="settings-form">
            <div className="form-group">
              <label>Đặt trước tối đa bao nhiêu ngày</label>
              <input type="number" name="maxBookingDays" value={settings.maxBookingDays} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label>Hủy trước bao nhiêu giờ</label>
              <input type="number" name="cancelBeforeHours" value={settings.cancelBeforeHours} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label>Số xe tối đa mỗi slot</label>
              <input type="number" name="maxVehiclePerSlot" value={settings.maxVehiclePerSlot} onChange={handleChange} />
            </div>
          </div>
        </div>

        <div className="settings-card">
          <h2>Cấu hình khách hàng thân thiết</h2>

          <div className="settings-form">
            <div className="form-group">
              <label>Silver từ số booking</label>
              <input type="number" name="silverBookings" value={settings.silverBookings} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label>Gold từ số booking</label>
              <input type="number" name="goldBookings" value={settings.goldBookings} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label>VIP từ số booking</label>
              <input type="number" name="vipBookings" value={settings.vipBookings} onChange={handleChange} />
            </div>
          </div>
        </div>

        <div className="settings-card">
          <h2>Thông báo</h2>

          <div className="toggle-list">
            <label>
              <input
                type="checkbox"
                name="emailNotification"
                checked={settings.emailNotification}
                onChange={handleChange}
              />
              Gửi thông báo Email
            </label>

            <label>
              <input
                type="checkbox"
                name="smsNotification"
                checked={settings.smsNotification}
                onChange={handleChange}
              />
              Gửi thông báo SMS
            </label>

            <label>
              <input
                type="checkbox"
                name="pushNotification"
                checked={settings.pushNotification}
                onChange={handleChange}
              />
              Gửi thông báo trên hệ thống
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}