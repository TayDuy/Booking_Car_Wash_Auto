import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Bell,
  CircleHelp
} from "lucide-react";
import "./SiteHeader.css";

export default function SiteHeader() {
  const navigate = useNavigate();
  const location = useLocation();

  // State quản lý việc hiển thị thông tin bên trong của 2 cụm chức năng
  const [isOpenNotification, setIsOpenNotification] = useState(false);
  const [isOpenSupport, setIsOpenSupport] = useState(false);

  const notificationRef = useRef(null);
  const supportRef = useRef(null);

  // Xử lý đóng các khung popover tự động khi click chuột ra ngoài vùng icon
  useEffect(() => {
    function handleClickOutside(event) {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setIsOpenNotification(false);
      }
      if (supportRef.current && !supportRef.current.contains(event.target)) {
        setIsOpenSupport(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
          className={location.pathname === "/home" ? "active-link" : ""}
          onClick={() => navigate("/home")}
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
          onClick={() => navigate("/loyalty")}
        >
          Loyalty
        </button>
      </nav>

      {/* RIGHT ACTIONS */}
      <div className="header-actions-group">
        
        {/* ICON NOTIFICATION (THÔNG BÁO) */}
        <div className="icon-popover-container" ref={notificationRef}>
          <button
            className={`action-btn-circle ${isOpenNotification ? "btn-active" : ""}`}
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
                {/* BẠN CỦA BẠN SẼ CODE LOGIC HOẶC MAP DATA THÔNG BÁO Ở ĐÂY */}
                <div className="placeholder-item">
                  <p>Hệ thống thông báo tự động sẵn sàng.</p>
                  <span>Vừa xong</span>
                </div>
              </div>
              
              <div className="popover-footer-action">Xem tất cả</div>
            </div>
          )}
        </div>

        {/* ICON SUPPORT (TRỢ GIÚP) */}
        <div className="icon-popover-container" ref={supportRef}>
          <button
            className={`action-btn-circle ${isOpenSupport ? "btn-active" : ""}`}
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
                {/* BẠN CỦA BẠN SẼ CODE TÍNH NĂNG CHAT/HOTLINE/SUPPORT Ở ĐÂY */}
                <div className="support-item-placeholder">
                  <p>☎️ Hotline: 1900 8888</p>
                  <small>Hỗ trợ kỹ thuật và phản hồi dịch vụ 24/7</small>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* PROFILE USER AVATAR */}
        <div className="profile-user-avatar">
          <img 
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80" 
            alt="User Avatar" 
          />
        </div>

      </div>
    </header>
  );
}