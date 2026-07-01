import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Bell, CircleHelp, User, LayoutDashboard, Car, History, LogOut, Gift } from "lucide-react";
import useAuth from "../../hooks/useAuth";
import "./SiteHeader.css";

export default function SiteHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth();
  const user = auth?.user;

  const [isOpenNotification, setIsOpenNotification] = useState(false);
  const [isOpenSupport, setIsOpenSupport] = useState(false);
  const [isOpenProfile, setIsOpenProfile] = useState(false);

  const notificationRef = useRef(null);
  const supportRef = useRef(null);
  const profileRef = useRef(null);

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

      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsOpenProfile(false);
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
              setIsOpenProfile(false);
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
              setIsOpenProfile(false);
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

        <div className="icon-popover-container" ref={profileRef}>
          <div
            className={`profile-user-avatar ${isOpenProfile ? "avatar-active" : ""}`}
            onClick={() => {
              setIsOpenProfile(!isOpenProfile);
              setIsOpenNotification(false);
              setIsOpenSupport(false);
            }}
            style={{ cursor: "pointer" }}
          >
            <img src="/car_avatar.png" alt="User Avatar" />
          </div>

          {isOpenProfile && (
            <div className="dropdown-popover-box profile-dropdown alignment-right">
              <div className="popover-arrow"></div>
              
              {/* User Card */}
              <div className="profile-dropdown-card">
                <div className="profile-dropdown-avatar">
                  <img src="/car_avatar.png" alt="User Avatar" />
                </div>
                <div className="profile-dropdown-info">
                  <div className="profile-dropdown-name">
                    {user?.fullName || user?.username || "Khách Hàng"}
                  </div>
                  <div className="profile-dropdown-role">Thành viên</div>
                </div>
              </div>

              <div 
                className="profile-dropdown-view-btn"
                onClick={() => {
                  setIsOpenProfile(false);
                  navigate("/customer/profile");
                }}
              >
                <User size={16} />
                <span>Xem trang cá nhân</span>
              </div>

              <div className="profile-dropdown-divider"></div>

              {/* Menu Options */}
              <div className="profile-dropdown-menu">
                <div 
                  className="profile-menu-item"
                  onClick={() => {
                    setIsOpenProfile(false);
                    navigate("/customer/profile#personal-info");
                    // Scroll to section helper
                    const el = document.getElementById("personal-info");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  <LayoutDashboard size={16} />
                  <span>Bảng điều khiển</span>
                </div>

                <div 
                  className="profile-menu-item"
                  onClick={() => {
                    setIsOpenProfile(false);
                    navigate("/customer/profile#my-vehicles");
                    const el = document.getElementById("my-vehicles");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  <Car size={16} />
                  <span>Xe của tôi</span>
                </div>

                <div 
                  className="profile-menu-item"
                  onClick={() => {
                    setIsOpenProfile(false);
                    navigate("/customer/history");
                  }}
                >
                  <History size={16} />
                  <span>Lịch sử rửa xe</span>
                </div>

                <div 
                  className="profile-menu-item"
                  onClick={() => {
                    setIsOpenProfile(false);
                    navigate("/customer/promotions");
                  }}
                >
                  <Gift size={16} />
                  <span>Ưu đãi của tôi</span>
                </div>

                <div 
                  className="profile-menu-item logout-item"
                  onClick={async () => {
                    setIsOpenProfile(false);
                    try {
                      const { logoutFromServer } = await import("../../api/authService");
                      await logoutFromServer();
                    } catch (err) {
                      console.error("Logout error:", err);
                    }
                    navigate("/auth/login");
                  }}
                >
                  <LogOut size={16} />
                  <span>Đăng xuất</span>
                </div>
              </div>

              <div className="profile-dropdown-divider"></div>
              <div className="profile-dropdown-footer">
                Quyền riêng tư · Điều khoản · WashFlow © 2026
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}