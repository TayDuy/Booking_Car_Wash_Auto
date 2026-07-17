import {
  CalendarPlus,
  CarFront,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Menu,
  UserRound,
  X,
} from "lucide-react";
import { useState } from "react";
import {
  NavLink,
  Outlet,
  useLocation,
} from "react-router-dom";

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
];

const PAGE_TITLES = {
  "/employee/dashboard": "Dashboard nhân viên",
  "/employee/queue": "Hàng đợi rửa xe",
  "/employee/bookings/new": "Tạo booking tại quầy",
};

function getStoredUser() {
  return {
    username: localStorage.getItem("username") || "",
    fullName:
      localStorage.getItem("fullName") ||
      localStorage.getItem("username") ||
      "Nhân viên",
    role: localStorage.getItem("role") || "EMPLOYEE",
  };
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
    "user",
  ].forEach((key) => {
    localStorage.removeItem(key);
  });
}

function EmployeeLayout() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const user = getStoredUser();

  const pageTitle =
    PAGE_TITLES[location.pathname] || "Employee Portal";

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const handleLogout = () => {
    clearAuthenticationStorage();
    window.location.replace("/auth/login");
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
            onClick={handleLogout}
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
              <span>{user.role}</span>
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
    </div>
  );
}

export default EmployeeLayout;