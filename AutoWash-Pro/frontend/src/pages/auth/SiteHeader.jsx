import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Bell, CircleHelp } from "lucide-react";
import "./SiteHeader.css";
import { countUnread, subscribeSSE } from "../../api/notificationService";

export default function SiteHeader() {
  const navigate = useNavigate();
  const location = useLocation();

  // Số thông báo chưa đọc — chỉ dùng để hiện badge đỏ trên chuông
  const [unreadCount, setUnreadCount] = useState(0);

  const loadUnreadCount = useCallback(async () => {
    try {
      const res = await countUnread();
      setUnreadCount(res?.count ?? 0);
    } catch (err) {
      console.error("Lỗi lấy số thông báo chưa đọc:", err);
    }
  }, []);

  useEffect(() => {
    loadUnreadCount();

    // Đăng ký SSE để badge tự cập nhật real-time khi có thông báo mới
    let es;
    try {
      es = subscribeSSE(() => {
        loadUnreadCount();
      });
    } catch (err) {
      console.warn("SSE không khả dụng:", err);
    }
    return () => es?.close?.();
  }, [loadUnreadCount]);

  return (
      <header className="custom-app-header">
        {/* BRAND LOGO - Click vào cũng về Trang chủ */}
        <div className="header-logo" onClick={() => navigate("/")}>
          <span className="logo-icon">🧼</span>
          <span className="logo-text">WashFlow Pro</span>
        </div>

        {/* NAVIGATION - ĐÃ ĐƯỢC KHÔI PHỤC "TRANG CHỦ" */}
        <nav className="header-navigation">
          <button
              className={location.pathname === "/" ? "active-link" : ""}
              onClick={() => navigate("/")}
          >
            Trang chủ
          </button>
          <button
              className={location.pathname === "/booking" ? "active-link" : ""}
              onClick={() => navigate("/booking")}
          >
            Đặt lịch
          </button>
          <button
              className={location.pathname === "/subscription" ? "active-link" : ""}
              onClick={() => navigate("/subscription")}
          >
            Ưu đãi thành viên
          </button>
          <button
              className={location.pathname === "/bookings" ? "active-link" : ""}
              onClick={() => navigate("/bookings")}
          >
            Lịch sử
          </button>
        </nav>

        {/* RIGHT ACTIONS */}
        <div className="header-actions-group">

          {/* ICON NOTIFICATION (THÔNG BÁO) — bấm vào đi thẳng sang trang /notifications */}
          <button
              className={`action-btn-circle ${location.pathname === "/notifications" ? "btn-active" : ""}`}
              onClick={() => navigate("/notifications")}
              aria-label="Thông báo"
          >
            <Bell size={18} strokeWidth={2} />
            {unreadCount > 0 && (
                <span className="red-alert-dot red-alert-dot--count">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
            )}
          </button>

          {/* ICON SUPPORT (TRỢ GIÚP) — bấm vào đi thẳng sang trang /support */}
          <button
              className={`action-btn-circle ${location.pathname === "/support" ? "btn-active" : ""}`}
              onClick={() => navigate("/support")}
              aria-label="Trợ giúp"
          >
            <CircleHelp size={18} strokeWidth={2} />
          </button>

          {/* PROFILE USER AVATAR */}
          <div className="profile-user-avatar" onClick={() => navigate("/profile")} style={{ cursor: "pointer" }}>
            <img
                src="/car_avatar.png"
                alt="User Avatar"
            />
          </div>

        </div>
      </header>
  );
}