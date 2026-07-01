import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Bell, CircleHelp } from "lucide-react";
import "./SiteHeader.css";

export default function SiteHeader() {
  const navigate = useNavigate();
  const location = useLocation();

  const [isOpenNotification, setIsOpenNotification] = useState(false);
  const [isOpenSupport, setIsOpenSupport] = useState(false);

  const notificationRef = useRef(null);
  const supportRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setIsOpenNotification(false);
      }

      if (supportRef.current && !supportRef.current.contains(event.target)) {
        setIsOpenSupport(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isActive = (path) => location.pathname === path;

  return (
    <header className="custom-app-header">
      <div
        className="header-logo"
        onClick={() => navigate("/customer/home")}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          cursor: "pointer",
        }}
      >
        <img
          src="/logo.png"
          alt="Logo"
          style={{ height: "48px", width: "auto" }}
        />
        <span className="logo-text">WashFlow Pro</span>
      </div>

      <nav className="header-navigation">
        <button
          className={isActive("/customer/home") ? "active-link" : ""}
          onClick={() => navigate("/customer/home")}
        >
          Trang chủ
        </button>

        <button
          className={isActive("/customer/booking") ? "active-link" : ""}
          onClick={() => navigate("/customer/booking")}
        >
          Đặt lịch
        </button>

        <button
          className={isActive("/customer/promotions") ? "active-link" : ""}
          onClick={() => navigate("/customer/promotions")}
        >
          Ưu đãi
        </button>

        <button
          className={isActive("/customer/history") ? "active-link" : ""}
          onClick={() => navigate("/customer/history")}
        >
          Lịch sử
        </button>

        <button
          className={isActive("/customer/profile") ? "active-link" : ""}
          onClick={() => navigate("/customer/profile")}
        >
          Hồ sơ
        </button>
      </nav>

      <div className="header-actions-group">
        <div className="icon-popover-container" ref={notificationRef}>
          <button
            className={`action-btn-circle ${
              isOpenNotification ? "btn-active" : ""
            }`}
            onClick={() => {
              setIsOpenNotification(!isOpenNotification);
              setIsOpenSupport(false);
            }}
          >
            <Bell size={18} strokeWidth={2} />
            <span className="red-alert-dot"></span>
          </button>

          {isOpenNotification && (
            <div className="dropdown-popover-box alignment-right">
              <div className="popover-arrow"></div>
              <div className="popover-header">Thông báo</div>

              <div className="popover-body-content">
                <div className="placeholder-item">
                  <p>Hệ thống thông báo tự động sẵn sàng.</p>
                  <span>Vừa xong</span>
                </div>
              </div>

              <div
                className="popover-footer-action"
                onClick={() => navigate("/customer/notifications")}
              >
                Xem tất cả
              </div>
            </div>
          )}
        </div>

        <div className="icon-popover-container" ref={supportRef}>
          <button
            className={`action-btn-circle ${
              isOpenSupport ? "btn-active" : ""
            }`}
            onClick={() => {
              setIsOpenSupport(!isOpenSupport);
              setIsOpenNotification(false);
            }}
          >
            <CircleHelp size={18} strokeWidth={2} />
          </button>

          {isOpenSupport && (
            <div className="dropdown-popover-box alignment-right">
              <div className="popover-arrow"></div>
              <div className="popover-header">Trung tâm hỗ trợ</div>

              <div className="popover-body-content">
                <div className="support-item-placeholder">
                  <p>☎️ Hotline: 1900 8888</p>
                  <small>Hỗ trợ kỹ thuật và phản hồi dịch vụ 24/7</small>
                </div>
              </div>

              <div
                className="popover-footer-action"
                onClick={() => navigate("/customer/support")}
              >
                Đi tới hỗ trợ
              </div>
            </div>
          )}
        </div>

        <div
          className="profile-user-avatar"
          onClick={() => navigate("/customer/profile")}
          style={{ cursor: "pointer" }}
        >
          <img src="/car_avatar.png" alt="User Avatar" />
        </div>
      </div>
    </header>
  );
}