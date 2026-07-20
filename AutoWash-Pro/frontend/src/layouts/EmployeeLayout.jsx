// frontend/src/layouts/EmployeeLayout.jsx
import {
  CalendarPlus,
  CarFront,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Menu,
  Undo2,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";

import employeeApi from "../api/employeeApi";
import LogoutConfirmModal from "../components/common/LogoutConfirmModal";

import "./EmployeeLayout.css";

const EMPLOYEE_NAVIGATION = [
  {
    label: "Dashboard",
    path: "/employee/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Hàng đợi",
    path: "/employee/queue",
    icon: ClipboardList,
  },
  {
    label: "Tạo booking",
    path: "/employee/bookings/new",
    icon: CalendarPlus,
  },
  {
    label: "Hoàn tiền",
    path: "/employee/refunds",
    icon: Undo2,
  },
];

const PAGE_TITLES = {
  "/employee/dashboard": "Dashboard nhân viên",
  "/employee/queue": "Hàng đợi rửa xe",
  "/employee/bookings/new": "Tạo booking tại quầy",
  "/employee/payment": "Thanh toán booking",
  "/employee/payment/success": "Thanh toán thành công",
  "/employee/refunds": "Yêu cầu hoàn tiền",
};

function getStoredUser() {
  let storedUser = {};

  try {
    storedUser = JSON.parse(localStorage.getItem("user") || "{}") || {};
  } catch {
    storedUser = {};
  }

  return {
    username:
        storedUser.username || localStorage.getItem("username") || "",
    fullName:
        storedUser.fullName ||
        localStorage.getItem("fullName") ||
        localStorage.getItem("username") ||
        "Nhân viên",
    role:
        storedUser.role || localStorage.getItem("role") || "EMPLOYEE",
    branchName:
        storedUser.branchName || localStorage.getItem("branchName") || "",
  };
}

function unwrapResponse(response) {
  return response?.data?.data ?? response?.data ?? response;
}

function normalizeEmployee(profile, fallbackUser) {
  return {
    username: profile?.username || fallbackUser.username,
    fullName: profile?.fullName || fallbackUser.fullName,
    role: profile?.role || fallbackUser.role,
    branchName:
        profile?.branchName ||
        profile?.branch?.branchName ||
        profile?.branch?.name ||
        fallbackUser.branchName,
  };
}

function getPageTitle(pathname) {
  return PAGE_TITLES[pathname] ||
      Object.entries(PAGE_TITLES).find(
          ([path]) => pathname.startsWith(`${path}/`)
      )?.[1] ||
      "Employee Portal";
}

function clearAuthenticationStorage() {
  [
    "token",
    "accessToken",
    "refreshToken",
    "username",
    "fullName",
    "role",
    "userId",
    "customerId",
    "employeeId",
    "branchId",
    "branchName",
    "permissions",
    "user",
  ].forEach((key) => {
    localStorage.removeItem(key);
  });
}

function EmployeeLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(getStoredUser);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const pageTitle = getPageTitle(location.pathname);

  useEffect(() => {
    let active = true;

    employeeApi
        .getProfile()
        .then((response) => {
          if (!active) {
            return;
          }

          setUser((currentUser) =>
              normalizeEmployee(unwrapResponse(response), currentUser)
          );
        })
        .catch(() => {
          // Giữ thông tin trong localStorage nếu profile tạm thời không tải được.
        });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!sidebarOpen) {
      return undefined;
    }

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setSidebarOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [sidebarOpen]);

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const handleCancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  const handleConfirmLogout = () => {
    setShowLogoutConfirm(false);
    clearAuthenticationStorage();
    navigate("/auth/login", { replace: true });
  };

  return (
      <div className="employee-layout">
        {sidebarOpen && (
            <button
                type="button"
                className="employee-layout__overlay"
                onClick={closeSidebar}
                aria-label="Đóng menu"
            />
        )}

        <aside
            id="employee-navigation"
            className={[
              "employee-sidebar",
              sidebarOpen ? "is-open" : "",
            ].join(" ")}
        >
          <header className="employee-sidebar__brand">
            <div className="employee-sidebar__logo">
              <CarFront size={27} aria-hidden="true" />
            </div>

            <div>
              <strong>AutoWash Pro</strong>
              <span>Employee Portal</span>
            </div>

            <button
                type="button"
                className="employee-sidebar__close"
                onClick={closeSidebar}
                aria-label="Đóng menu"
            >
              <X size={21} aria-hidden="true" />
            </button>
          </header>

          <nav
              className="employee-sidebar__navigation"
              aria-label="Điều hướng nhân viên"
          >
            <p className="employee-sidebar__section-label">
              Vận hành
            </p>

            {EMPLOYEE_NAVIGATION.map((item) => {
              const Icon = item.icon;

              return (
                  <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={closeSidebar}
                      className={({ isActive }) =>
                          [
                            "employee-sidebar__link",
                            isActive ? "is-active" : "",
                          ].join(" ")
                      }
                  >
                    <Icon size={20} aria-hidden="true" />
                    <span>{item.label}</span>
                  </NavLink>
              );
            })}
          </nav>

          <footer className="employee-sidebar__footer">
            <div className="employee-sidebar__user">
              <div className="employee-sidebar__avatar">
                <UserRound size={20} aria-hidden="true" />
              </div>

              <div>
                <strong>{user.fullName}</strong>
                <span>{user.username || "Employee"}</span>
              </div>
            </div>

            <button
                type="button"
                className="employee-sidebar__logout"
                onClick={handleLogoutClick}
            >
              <LogOut size={19} aria-hidden="true" />
              <span>Đăng xuất</span>
            </button>
          </footer>
        </aside>

        <div className="employee-layout__content">
          <header className="employee-topbar">
            <div className="employee-topbar__left">
              <button
                  type="button"
                  className="employee-topbar__menu"
                  onClick={() => setSidebarOpen(true)}
                  aria-label="Mở menu"
                  aria-controls="employee-navigation"
                  aria-expanded={sidebarOpen}
              >
                <Menu size={22} aria-hidden="true" />
              </button>

              <div>
                <span>AutoWash Pro</span>
                <h1>{pageTitle}</h1>
              </div>
            </div>

            <div className="employee-topbar__account">
              <div>
                <strong>{user.fullName}</strong>
                <span>
                {user.branchName || "Chưa phân chi nhánh"} · {user.role}
              </span>
              </div>

              <div className="employee-topbar__avatar">
                <UserRound size={20} aria-hidden="true" />
              </div>
            </div>
          </header>

          <main className="employee-layout__main">
            <Outlet />
          </main>
        </div>

        <LogoutConfirmModal
            open={showLogoutConfirm}
            onCancel={handleCancelLogout}
            onConfirm={handleConfirmLogout}
        />
      </div>
  );
}

export default EmployeeLayout;