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

  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!user) return;

    const loadNotifications = async () => {
      try {
        const { countUnread, getUnread } = await import("../../api/notificationService");
        const countRes = await countUnread();
        setUnreadCount(countRes.count || 0);

        const listRes = await getUnread();
        setNotifications(listRes || []);
      } catch (err) {
        console.error("Lỗi lấy thông báo:", err);
      }
    };
    loadNotifications();

    let es;
    const connectSSE = async () => {
      try {
        const { subscribeSSE } = await import("../../api/notificationService");
        es = subscribeSSE(
          (msg) => {
            setUnreadCount((prev) => prev + 1);
            setNotifications((prev) => [msg, ...prev]);
          },
          null,
          async () => {
            const countRes = await countUnread();
            setUnreadCount(countRes.count || 0);
            const listRes = await getUnread();
            setNotifications(listRes || []);
          }
        );
      } catch (err) {
        console.warn("SSE subscribe failed:", err);
      }
    };
    connectSSE();

    return () => {
      if (es) es.close();
    };
  }, [user]);

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
          className={isActive("/customer/services") ? "active-link" : ""}
          onClick={() => navigate("/customer/services")}
        >
          Dịch vụ
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
            {unreadCount > 0 && <span className="red-alert-dot"></span>}
          </button>

          {isOpenNotification && (
            <div className="dropdown-popover-box alignment-right">
              <div className="popover-arrow"></div>
              <div className="popover-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Thông báo</span>
                {unreadCount > 0 && (
                  <button 
                    style={{ background: 'none', border: 'none', color: '#0046c7', fontSize: '11px', fontWeight: '600', cursor: 'pointer', padding: 0 }}
                    onClick={async () => {
                      try {
                        const { markAllRead } = await import("../../api/notificationService");
                        await markAllRead();
                        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                        setUnreadCount(0);
                      } catch (err) {
                        console.error("Lỗi đánh dấu đọc tất cả:", err);
                      }
                    }}
                  >
                    Đọc tất cả
                  </button>
                )}
              </div>

              <div className="popover-body-content" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {notifications.length > 0 ? (
                  notifications.slice(0, 5).map((noti) => (
                    <div 
                      key={noti.notificationId || noti.id} 
                      className={`placeholder-item ${noti.read ? "read-item" : "unread-item"}`}
                      style={{ 
                        cursor: "pointer", 
                        borderBottom: "1px solid #f1f5f9", 
                        padding: "10px 12px",
                        backgroundColor: noti.read ? '#ffffff' : '#f8fafc',
                        transition: 'background-color 0.2s'
                      }}
                      onClick={async () => {
                        if (noti.read) return;
                        try {
                          const { markAsRead } = await import("../../api/notificationService");
                          await markAsRead(noti.notificationId || noti.id);
                          setNotifications(prev => prev.map(n => 
                            (n.notificationId === noti.notificationId || n.id === noti.id) ? { ...n, read: true } : n
                          ));
                          setUnreadCount(prev => Math.max(0, prev - 1));
                        } catch (err) {
                          console.error("Lỗi đánh dấu đã đọc:", err);
                        }
                        setIsOpenNotification(false);
                        if (noti.referenceType === 'payment') {
                          try {
                            const { default: axiosClient } = await import("../../api/axiosClient");
                            const resp = await axiosClient.get(`/payments/${noti.referenceId}`);
                            const pid = resp.data?.data?.bookingId;
                            if (pid) { navigate(`/customer/booking/${pid}`); return; }
                          } catch {}
                        }
                        if (noti.referenceId) {
                          navigate(`/customer/booking/${noti.referenceId}`);
                        } else {
                          navigate('/customer/history');
                        }
                      }}
                    >
                      <p style={{ margin: "0 0 4px 0", fontSize: "13px", fontWeight: noti.read ? "normal" : "600", color: "#334155" }}>
                        {noti.title}
                      </p>
                      <p style={{ margin: "0 0 4px 0", fontSize: "12px", color: "#64748b", lineHeight: '1.4' }}>
                        {noti.body ?? noti.content}
                      </p>
                      <span style={{ fontSize: "10px", color: "#94a3b8" }}>
                        {noti.createdAt ? new Date(noti.createdAt).toLocaleString("vi-VN") : "Vừa xong"}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="placeholder-item" style={{ padding: "20px", textAlign: "center", color: "#94a3b8", fontSize: "13px" }}>
                    Không có thông báo mới.
                  </div>
                )}
              </div>

              <div
                className="popover-footer-action"
                onClick={() => {
                  setIsOpenNotification(false);
                  navigate("/customer/notifications");
                }}
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
                  <div className="profile-dropdown-role">
                    {user?.role === "ADMIN" ? "Quản trị viên" : user?.role === "STAFF" ? "Nhân viên" : user?.role === "MANAGER" ? "Quản lý" : "Thành viên"}
                  </div>
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
                    const role = String(user?.role || "").toUpperCase();
                    if (role === "ADMIN") {
                      navigate("/admin");
                    } else if (role === "MANAGER" || role === "STAFF") {
                      navigate("/manager");
                    } else {
                      navigate("/customer/profile#personal-info");
                      // Scroll to section helper
                      const el = document.getElementById("personal-info");
                      if (el) el.scrollIntoView({ behavior: "smooth" });
                    }
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
                    auth.logout();
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