import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import { logoutFromServer } from "../../api/authService";
import { countUnread } from "../../api/notificationService";

import {
  Bell,
  Moon,
  Sun,
  Search,
  Menu,
  ChevronDown,
  LogOut,
  Settings,
  UserRound,
} from "lucide-react";

import "./Header.css";

const adminPages = [
  {
    label: "Dashboard",
    keywords: "dashboard tổng quan",
    path: "/admin/dashboard",
  },
  {
    label: "Đặt lịch",
    keywords: "booking đặt lịch",
    path: "/admin/bookings",
  },
  {
    label: "Đơn hàng",
    keywords: "order đơn hàng dịch vụ",
    path: "/admin/orders",
  },
  {
    label: "Khách hàng",
    keywords: "customer khách hàng",
    path: "/admin/customers",
  },
  {
    label: "Xe của khách",
    keywords: "vehicle xe biển số",
    path: "/admin/vehicles",
  },
  {
    label: "Chi nhánh",
    keywords: "branch chi nhánh",
    path: "/admin/branches",
  },
  {
    label: "Dịch vụ",
    keywords: "service dịch vụ",
    path: "/admin/services",
  },
  {
    label: "Khuyến mãi",
    keywords: "promotion khuyến mãi voucher",
    path: "/admin/promotions",
  },
  {
    label: "Lịch sử thanh toán",
    keywords: "payment thanh toán doanh thu",
    path: "/admin/payments",
  },
  {
    label: "Báo cáo",
    keywords: "report báo cáo thống kê",
    path: "/admin/reports",
  },
  {
    label: "Nhật ký hệ thống",
    keywords: "audit log nhật ký",
    path: "/admin/audit-logs",
  },
  {
    label: "Phân quyền",
    keywords: "role phân quyền",
    path: "/admin/roles",
  },
  {
    label: "Cấu hình",
    keywords: "setting cấu hình",
    path: "/admin/settings",
  },
];

export default function Header({ onToggleSidebar }) {
  const auth = useAuth();
  const navigate = useNavigate();
  const profileRef = useRef(null);

  const [profileOpen, setProfileOpen] = useState(false);
  const [unreadNotificationCount, setUnreadNotificationCount] =
    useState(0);
  const [searchValue, setSearchValue] = useState("");

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem("adminTheme");

    if (savedTheme) {
      return savedTheme === "dark";
    }

    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
  });

  async function loadUnreadNotificationCount() {
    try {
      const result = await countUnread();

      const count =
        typeof result === "number"
          ? result
          : Number(result?.count || 0);

      setUnreadNotificationCount(count);
    } catch (error) {
      console.error(
        "Load unread notification count failed:",
        error
      );

      setUnreadNotificationCount(0);
    }
  }

  const rawFullName =
    auth?.user?.fullName ||
    auth?.user?.name ||
    auth?.user?.username ||
    localStorage.getItem("fullName") ||
    localStorage.getItem("username");

  const fullName =
    rawFullName &&
      String(rawFullName).trim() &&
      String(rawFullName).trim().toLowerCase() !== "unknown"
      ? String(rawFullName).trim()
      : "Admin";

  const role =
    auth?.user?.role ||
    localStorage.getItem("role") ||
    "ADMIN";

  const avatarText =
    String(fullName || "A")
      .trim()
      .charAt(0)
      .toUpperCase() || "A";

  useEffect(() => {
    const theme = isDarkMode ? "dark" : "light";

    document.documentElement.setAttribute(
      "data-theme",
      theme
    );

    localStorage.setItem("adminTheme", theme);
  }, [isDarkMode]);

  useEffect(() => {
    loadUnreadNotificationCount();

    function handleNotificationCountChanged() {
      loadUnreadNotificationCount();
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        loadUnreadNotificationCount();
      }
    }

    window.addEventListener(
      "admin-notification-count-changed",
      handleNotificationCountChanged
    );

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    const intervalId = window.setInterval(
      loadUnreadNotificationCount,
      30000
    );

    return () => {
      window.removeEventListener(
        "admin-notification-count-changed",
        handleNotificationCountChanged
      );

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );

      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target)
      ) {
        setProfileOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  function handleToggleTheme() {
    setIsDarkMode((previousValue) => !previousValue);
  }

  function handleSearch(event) {
    event.preventDefault();

    const keyword = searchValue
      .trim()
      .toLowerCase();

    if (!keyword) {
      return;
    }

    const matchedPage = adminPages.find((page) => {
      const searchableText =
        `${page.label} ${page.keywords}`.toLowerCase();

      return searchableText.includes(keyword);
    });

    if (!matchedPage) {
      alert(
        `Không tìm thấy trang quản trị phù hợp với "${searchValue}".`
      );

      return;
    }

    navigate(matchedPage.path);
    setSearchValue("");
  }

  async function handleLogout() {
    const confirmed = window.confirm(
      "Bạn có chắc muốn đăng xuất khỏi tài khoản Admin không?"
    );

    if (!confirmed) {
      return;
    }

    setProfileOpen(false);

    try {
      await logoutFromServer();
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      navigate("/auth/login", {
        replace: true,
      });
    }
  }

  return (
    <header className="admin-header">
      <div className="header-left">
        <button
          type="button"
          className="icon-btn"
          title="Thu gọn hoặc mở rộng thanh menu"
          onClick={() => onToggleSidebar?.()}
        >
          <Menu size={20} />
        </button>

        <form
          className="search-box"
          onSubmit={handleSearch}
        >
          <Search size={18} />

          <input
            type="text"
            list="admin-page-search"
            placeholder="Tìm trang quản trị..."
            value={searchValue}
            onChange={(event) =>
              setSearchValue(event.target.value)
            }
          />

          <datalist id="admin-page-search">
            {adminPages.map((page) => (
              <option
                key={page.path}
                value={page.label}
              />
            ))}
          </datalist>
        </form>
      </div>

      <div className="header-right">
        <button
          type="button"
          className="icon-btn notification-btn"
          title="Thông báo"
          onClick={() =>
            navigate("/admin/notifications")
          }
        >
          <Bell size={19} />

          {unreadNotificationCount > 0 && (
            <span className="notification-dot">
              {unreadNotificationCount > 99
                ? "99+"
                : unreadNotificationCount}
            </span>
          )}
        </button>

        <button
          type="button"
          className={`icon-btn theme-toggle-btn ${isDarkMode ? "active" : ""
            }`}
          title={
            isDarkMode
              ? "Chuyển sang giao diện sáng"
              : "Chuyển sang giao diện tối"
          }
          onClick={handleToggleTheme}
        >
          {isDarkMode ? (
            <Sun size={19} />
          ) : (
            <Moon size={19} />
          )}
        </button>

        <div
          className="admin-profile-wrapper"
          ref={profileRef}
        >
          <button
            type="button"
            className={`admin-profile ${profileOpen ? "open" : ""
              }`}
            onClick={() =>
              setProfileOpen(
                (previousValue) => !previousValue
              )
            }
          >
            <div className="admin-avatar">
              {avatarText}
            </div>

            <div className="admin-profile-info">
              <strong>{fullName}</strong>
              <p>{role}</p>
            </div>

            <ChevronDown
              size={16}
              className={`profile-chevron ${profileOpen ? "rotated" : ""
                }`}
            />
          </button>

          {profileOpen && (
            <div className="admin-profile-dropdown">
              <div className="profile-dropdown-header">
                <div className="admin-avatar large">
                  {avatarText}
                </div>

                <div>
                  <strong>{fullName}</strong>
                  <p>{role}</p>
                </div>
              </div>

              <div className="profile-dropdown-divider" />

              <button
                type="button"
                onClick={() => {
                  setProfileOpen(false);
                  navigate("/admin/settings");
                }}
              >
                <Settings size={17} />
                Cấu hình hệ thống
              </button>

              <button
                type="button"
                onClick={() => {
                  setProfileOpen(false);
                  navigate("/admin/roles");
                }}
              >
                <UserRound size={17} />
                Phân quyền
              </button>

              <div className="profile-dropdown-divider" />

              <button
                type="button"
                className="logout-menu-item"
                onClick={handleLogout}
              >
                <LogOut size={17} />
                Đăng xuất
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}