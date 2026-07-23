import { Link, useLocation } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import "./PublicHeader.css";

export default function PublicHeader() {
  const location = useLocation();
  const auth = useAuth();
  const user = auth?.user;
  const token = auth?.token || localStorage.getItem("token");
  const isLoggedIn = Boolean(token && (user || localStorage.getItem("username")));

  const isActive = (path) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  const getHomePath = () => {
    if (!isLoggedIn) return "/";
    const role = (user?.role || localStorage.getItem("role") || "").toUpperCase();
    if (role === "ADMIN") return "/admin/dashboard";
    if (role === "EMPLOYEE") return "/employee/dashboard";
    return "/customer/home";
  };

  return (
    <header className="public-header">
      <div className="app-container public-header-inner">
        <Link to={getHomePath()} className="public-logo">
          <img src="/logo.png" alt="Logo" className="public-logo-img" />
          WashFlow Pro
        </Link>

        <nav className="public-nav">
          <Link to={getHomePath()} className={isActive("/") || isActive("/customer/home") ? "nav-active" : ""}>Trang chủ</Link>
          <Link to={isLoggedIn ? "/customer/services" : "/services"} className={isActive("/services") || isActive("/customer/services") ? "nav-active" : ""}>Dịch vụ</Link>
          <Link to={isLoggedIn ? "/customer/booking" : "/auth/login?redirect=/customer/booking"} className={isActive("/customer/booking") ? "nav-active" : ""}>Đặt lịch</Link>
          <Link to={isLoggedIn ? "/customer/support" : "/support"} className={isActive("/support") || isActive("/customer/support") ? "nav-active" : ""}>Hỗ trợ & Liên hệ</Link>
        </nav>

        <div className="public-actions">
          {isLoggedIn ? (
            <Link to="/customer/profile" className="public-login-btn">
              {(() => {
                const rawName = user?.fullName || user?.username || localStorage.getItem("fullName") || localStorage.getItem("username");
                return rawName && String(rawName).trim() && String(rawName).trim().toLowerCase() !== "unknown"
                  ? String(rawName).trim()
                  : "Tài khoản";
              })()}
            </Link>
          ) : (
            <>
              <Link to="/auth/login" className="public-login-btn">Đăng nhập</Link>
              <Link to="/auth/register" className="public-register-btn">Đăng ký</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
